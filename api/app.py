from flask import Flask, request, jsonify, send_from_directory
from sqlalchemy.orm import joinedload
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit, join_room, leave_room
import jwt
import os
from datetime import datetime, timedelta
import random
import boto3
import requests
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()


app = Flask(__name__)

db_user = os.environ.get("DB_USER")
db_password = os.environ.get("DB_PASSWORD")
db_host = os.environ.get("DB_HOST")
db_port = os.environ.get("DB_PORT")
db_name = os.environ.get("DB_NAME")

app.config[
    "SQLALCHEMY_DATABASE_URI"
] = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://me:password@localhost:5432/chatapp'
app.config["SECRET_KEY"] = os.urandom(24)
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*")

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="eu-west-2",
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    expo_push_token = db.Column(db.String(200))
    username = db.Column(db.String(80), unique=False, nullable=False)
    password = db.Column(db.String(80), unique=False, nullable=False)
    interests = db.Column(db.Text)
    description = db.Column(db.String(240))
    profile_picture = db.Column(db.String(500))
    open_dms = db.Column(db.Boolean, default=True)
    age = db.Column(db.Integer)
    sex = db.Column(db.String(10))
    location = db.Column(db.String(80))
    online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    banned = db.Column(db.DateTime, nullable=True, default=None)
    banned_for = db.Column(db.Text, nullable=True, default=None)
    strike = db.Column(db.Integer, default=0)
    warning = db.Column(db.Text, nullable=True, default=None)


class UserChat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat.id"), nullable=False)


class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user1 = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user2 = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    last_message = db.Column(db.String(80))
    last_message_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_message_type = db.Column(db.String(10))
    unread_messages = db.Column(db.Integer, default=0)
    last_sender = db.Column(db.Integer, default=0)
    blocked_by = db.Column(db.Integer, default=0)
    hidden_by = db.Column(db.Integer, default=0)
    friends = db.Column(db.Integer, default=0)
    user1_relation = db.relationship("User", foreign_keys=[user1])
    user2_relation = db.relationship("User", foreign_keys=[user2])

    def __repr__(self):
        return f"<Chat {self.id}>"


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(10))

    def __repr__(self):
        return f"<Message {self.id}>"


class BlockList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    blocker = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    blocked = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reported = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    reporter = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    reason = db.Column(db.Text)
    elaboration = db.Column(db.Text)
    pfp = db.Column(db.Text)
    status = db.Column(db.String(20), default="Pending")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


@app.route("/", methods=["POST", "GET"])
def return_200():
    return jsonify({"message": "wassup, cleared data"}), 200

# admin stuff
@app.route("/report-bug", methods=["POST"])
def handle_report_bug():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        data = request.json
        content = data["description"]

        message = MIMEMultipart()
        message["From"] = "simplechatbugreports@gmail.com"
        message["To"] = "simplechatbugreports@gmail.com"
        message["Subject"] = "Bug Report"
        message.attach(MIMEText(content, "plain"))

        try:
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login("simplechatbugreports@gmail.com", "azfz vqfr nvvx gzws")
            server.sendmail(
                "simplechatbugreports@gmail.com",
                "simplechatbugreports@gmail.com",
                message.as_string(),
            )
            server.quit()
            # print("Email sent!")
            return jsonify({"message": "successfully sent email!"}), 200
        except Exception as e:
            # print(str(e))
            return jsonify({"message": str(e)}), 400

    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route("/1admin1/request-admin-access", methods=["GET"])
def handle_request_admin_access():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        user_id = request.args.get("userId")
        password = request.args.get("password")

        # print(id, user_id, password)

        if id == 1 and int(user_id) == 1 and password == "Taylam":
            return jsonify({"message": "Authorized"}), 200
        else:
            return jsonify({"message": "Unauthorized"}), 401
    except Exception as e:
        # print(e)
        return jsonify({"message": str(e)}), 404


@app.route("/1admin1/request-reports", methods=["GET"])
def handle_request_reports():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        user_id = request.args.get("userId")
        password = request.args.get("password")
        if not (id == 1 and int(user_id) == 1 and password == "Taylam"):
            return jsonify({"message": "Unauthorized"}), 401

        reports = Report.query.all()
        reports_list = []
        for report in reports:
            if report.status != "resolved":
                reports_list.append(
                    {
                        "id": report.id,
                        "reported": report.reported,
                        "reporter": report.reporter,
                        "reason": report.reason,
                        "elaboration": report.elaboration,
                        "status": report.status,
                        "timestamp": report.timestamp,
                        "pfp": report.pfp,
                    }
                )
        return jsonify({"reports": reports_list}), 200
    except Exception as e:
        # print(str(e))
        return jsonify({"message": str(e)}), 404


@socketio.on("ban_user")
def handle_ban_emit(data):
    user = User.query.get(data["user"])
    if user.banned:
        formatted_datetime = user.banned.strftime("%d/%m/%Y at %H:%M UTC")
    else:
        formatted_datetime = None
    socketio.emit(
        "banned",
        {"duration": formatted_datetime, "reason": data["reason"]},
        room=f'user_{data["user"]}',
    )


@app.route("/1admin1/ban-user", methods=["POST"])
def handle_ban_user():
    try:
        # print("Running ban...")
        # print("Authorizing...")
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        # print("DATA IS", data)
        password = data["password"]
        if not (id == 1 and password == "Taylam"):
            return jsonify({"message": "Unauthorized"}), 401
        # print("Authorised!")

        # print("Getting reported_user with id data[user]:", data['user'], '...')
        reported_user = User.query.get(data["user"])
        if reported_user is None:
            return jsonify({"message": "User not found"}), 404

        # print("Successfully got user!")
        # print("Getting duration...")
        duration = data["duration"]
        # print("Successfully got duration!", duration)

        if duration == 1:
            reported_user.banned = datetime.utcnow() + timedelta(days=1)
        elif duration == 7:
            reported_user.banned = datetime.utcnow() + timedelta(days=7)
        elif duration == 100:
            reported_user.banned = datetime.utcnow() + timedelta(days=36525)

        reported_user.banned_for = data["reason"]

        # print("Incrementing strike...")
        reported_user.strike += (
            1  # Make sure that 'strike' is defined in your User model
        )
        # print("Successfully incremented strike!")

        # print("Getting report with report ID:", data['reportId'], "which is of type", type(data['reportId']))
        reports = Report.query.filter_by(reported=reported_user.id).all()

        if len(reports) == 0:
            return jsonify({"message": "No reports found for this user"}), 404

        # Loop through and delete all fetched reports
        for report in reports:
            db.session.delete(report)

        # Commit the changes
        db.session.commit()

        return jsonify({"message": "All reports deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        # print(str(e))
        return jsonify({"message": str(e)}), 500


@socketio.on("warn_user")
def handle_warn_emit(data):
    # print("data of warn is", data)
    socketio.emit("warned", {"reason": data["reason"]}, room=f'user_{data["user"]}')


@app.route("/acknowledge-warning", methods=["POST"])
def handle_warning_acknowledged():
    try:
        data = request.json
        user_id = data["userId"]
        user = User.query.get(user_id)
        if user:
            user.warning = None
            db.session.commit()
            return jsonify({"message": "successfully acknowledged warning"}), 200
        else:
            return jsonify({"message": "could not find user"}), 404
    except Exception as e:
        db.session.rollback()
        # print(str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/1admin1/warn-user", methods=["POST"])
def handle_warn_user():
    try:
        # print("Entering handle_warn_user....")
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        # print("Data in handle_warn_user:", data)
        password = data["password"]

        if not (id == 1 and password == "Taylam"):
            return jsonify({"message": "Unauthorized"}), 401

        reported_user = User.query.get(data["user"])
        if reported_user is None:
            return jsonify({"message": "User not found"}), 404

        reported_user.strike += 1
        # print("updating warning...")
        reported_user.warning = data["reason"]

        # Handle the report
        reports = Report.query.filter_by(reported=reported_user.id).all()

        if len(reports) == 0:
            return jsonify({"message": "No reports found for this user"}), 404

        # Loop through and delete all fetched reports
        for report in reports:
            db.session.delete(report)

        # Commit the changes
        db.session.commit()

        return jsonify({"message": "All reports deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        # print(str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/1admin1/acquit-user", methods=["POST"])
def handle_acquit_user():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        password = data["password"]

        if not (id == 1 and password == "Taylam"):
            return jsonify({"message": "Unauthorized"}), 401

        # Find the user based on the report ID
        reported_user = User.query.get(data["user"])
        if reported_user is None:
            return jsonify({"message": "User not found"}), 404

        # Handle the report
        reports = Report.query.filter_by(reported=reported_user.id).all()

        if len(reports) == 0:
            return jsonify({"message": "No reports found for this user"}), 404

        # Loop through and delete all fetched reports
        for report in reports:
            db.session.delete(report)

        # Commit the changes
        db.session.commit()

        return jsonify({"message": "All reports deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        # print(str(e))  # Logging this would be better in production
        return jsonify({"message": str(e)}), 500


@app.route("/1admin1/remove-pfp", methods=["POST"])
def handle_remove_pfp():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        password = data["password"]

        if not (id == 1 and password == "Taylam"):
            return jsonify({"message": "Unauthorized"}), 401

        # Find the user based on the report ID
        reported_user = User.query.get(data["user"])
        if reported_user is None:
            return jsonify({"message": "User not found"}), 404

        # Update the profile picture to the default image
        reported_user.profile_picture = "https://d1zmmxvc41334f.cloudfront.net/pfp.png"

        # Commit the changes
        db.session.commit()

        return jsonify({"message": "Profile picture removed successfully"}), 200

    except Exception as e:
        db.session.rollback()
        # print(str(e))  # In production, consider logging this error
        return jsonify({"message": str(e)}), 500


@app.route("/report", methods=["POST"])
def handle_report():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        # print(data)
        new_report = Report(
            reported=data["reported"],
            reporter=data["reporter"],
            reason=data["reason"],
            elaboration=data["elaboration"],
            pfp=data["pfp"],
        )
        db.session.add(new_report)
        db.session.commit()

        return jsonify({"message": "sucessfully updated report"}), 200

    except Exception as e:
        # print(str(e))
        return jsonify({"message": str(e)}), 404


@app.route("/update-data", methods=["POST"])
def handle_update_data():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]

        data = request.json
        # print("data is", data)
        user = User.query.filter_by(id=id).first()

        user.description = data["description"]
        interests = "&".join(data["interests"])
        user.interests = interests
        user.profile_picture = data["pfp"]
        user.open_dms = data["opendms"]
        db.session.commit()

        return jsonify({"message": "updated data"}), 200
    except Exception as e:
        db.session.rollback()
        # print("from update data", str(e))
        return jsonify({"message": "Error"}), 500


@app.route("/hide", methods=["POST"])
def handle_hide():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        chat_id = data["chatId"]
        chat = Chat.query.get(chat_id)
        chat.hidden_by = (
            id if chat.hidden_by == 0 else -1
        )  # if the chat has already been hidden then set the hidden by to -1 indicating both hid it
        db.session.commit()
        return jsonify({"message": "Chat hidden."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route("/unhide", methods=["POST"])
def handle_unhide():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        data = request.json
        chat_id = data["chatId"]
        other_id = data["otherId"]
        chat = Chat.query.get(chat_id)
        chat.hidden_by = 0 if chat.hidden_by == id else other_id
        db.session.commit()
        return jsonify({"message": "Chat hidden."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route("/createchat", methods=["POST"])
def create_chat():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]

        data = request.json
        blocked_users = [
            user_id
            for i in BlockList.query.filter(
                db.or_(BlockList.blocker == id, BlockList.blocked == id)
            ).all()
            for user_id in [i.blocked, i.blocker]
        ]
        blocked_users = list(set(blocked_users))

        active_chats_query = (
            db.session.query(UserChat.user_id)
            .join(Chat, UserChat.chat_id == Chat.id)
            .filter(
                UserChat.user_id != id,
                Chat.id.in_(
                    db.session.query(UserChat.chat_id).filter(UserChat.user_id == id)
                ),
                Chat.last_message != "",
            )
            .all()
        )

        active_chats = [chat.user_id for chat in active_chats_query]
        active_chats.append(id)
        active_chats.append(data.get("lastSearched"))
        # print("ACTIVE CHATS", active_chats)

        gender = data.get("gender")
        max_age = data.get("maxAge")
        min_age = data.get("minAge")
        interests_enabled = data.get("matchByInterests")
        interests = data.get("interests")
        # print(gender, max_age, min_age, interests_enabled, interests)

        filters = [
            db.and_(User.banned == None, User.open_dms == True),
            ~User.id.in_(active_chats + blocked_users),
            User.last_seen < datetime.utcnow() + timedelta(days=2),
            User.last_seen < datetime.utcnow() + timedelta(hours=2),
            User.age <= max_age,
            User.age >= min_age,
        ]

        if gender != "Any":
            filters.insert(2, User.sex == gender)

        if interests_enabled:
            interest_filters = [
                User.interests.ilike(f"%{interest}%") for interest in interests
            ]

            filters.append(db.or_(*interest_filters))

        while len(filters) > 2:  # first two filters are non-negotiable
            potential_match_count = User.query.filter(db.and_(*filters)).count()
            if potential_match_count != 0:
                break
            filters.pop()

        if len(filters) == 2:
            return jsonify({"message": "No matches found."}), 404

        random_offset = random.randint(0, potential_match_count - 1)

        potential_match = (
            User.query.filter(db.and_(*filters)).offset(random_offset).first()
        )
        # print(potential_match)

        existing_chat = Chat.query.filter(
            db.or_(
                db.and_(Chat.user1 == potential_match.id, Chat.user2 == id),
                db.and_(Chat.user1 == id, Chat.user2 == potential_match.id),
            )
        ).first()

        if (
            existing_chat
        ):  # if there is already a chat, then simply navigate to that chat without updating the database
            return jsonify(
                {
                    "message": "Chat already exists. Rerouting...",
                    "chat_id": existing_chat.id,
                    "friends": existing_chat.friends,
                    "username": potential_match.username,
                    "online": potential_match.online,
                    "lastSeen": potential_match.last_seen,
                    "otherId": potential_match.id,
                    "pfp": potential_match.profile_picture,
                }
            )

        # else update the database and navigate to the new chat
        new_chat = Chat(user1=id, user2=potential_match.id, last_message="")
        db.session.add(new_chat)
        db.session.commit()

        chat_id = new_chat.id
        new_connection1 = UserChat(user_id=id, chat_id=chat_id)
        new_connection2 = UserChat(user_id=new_chat.user2, chat_id=new_chat.id)
        db.session.add(new_connection1)
        db.session.add(new_connection2)
        db.session.commit()

        # print("CHAT BETWEEN", id, "AND", new_chat.user2, "CREATED!")
        return (
            jsonify(
                {
                    "message": "Successfully created chat",
                    "chat_id": chat_id,
                    "friends": 0,
                    "username": potential_match.username,
                    "online": potential_match.online,
                    "lastSeen": potential_match.last_seen,
                    "otherId": potential_match.id,
                    "pfp": potential_match.profile_picture,
                }
            ),
            200,
        )

    except Exception as e:
        # print(str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/serve-chats", methods=["GET"])
def serve_chats():
    try:
        start_time = time.time()

        # Authorisation
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]

        # Retrieving parameters
        category = request.args.get("category")
        offset = int(request.args.get("offset", 0))

        # Get all chat_ids related to the user
        chat_ids = [
            entry.chat_id for entry in UserChat.query.filter_by(user_id=id).all()
        ]
        # print("chat ids", chat_ids)

        # Load chats and their related 'other' users in one query
        base_query = (
            Chat.query.filter(Chat.id.in_(chat_ids), Chat.last_message != "")
            .order_by(Chat.last_message_date.desc())
            .options(joinedload(Chat.user1_relation), joinedload(Chat.user2_relation))
        )

        # Additional filters based on category
        if category == "friends":
            base_query = base_query.filter(Chat.friends == -1)
        elif category == "visible":
            base_query = base_query.filter(
                Chat.blocked_by != id, Chat.hidden_by not in [id, -1]
            )
        elif category == "blocked":
            base_query = base_query.filter(
                db.or_(Chat.blocked_by == id, Chat.hidden_by != 0)
            )

        # Apply pagination parameters
        chats = base_query.offset(offset).limit(5).all()

        # print("Chats:", chats)
        # print("Category:", category)

        chat_list = []

        for chat in chats:
            other = chat.user2_relation if chat.user2 != id else chat.user1_relation

            chat_list.append(
                {
                    "chatId": chat.id,
                    "userId": id,
                    "title": other.username,
                    "otherId": other.id,
                    "lastMessage": chat.last_message,
                    "lastMessageDate": chat.last_message_date,
                    "lastMessageType": chat.last_message_type,
                    "pfp": other.profile_picture,
                    "lastSender": chat.last_sender,
                    "unreadMessages": chat.unread_messages,
                    "online": other.online,
                    "lastSeen": other.last_seen,
                    "blocked": chat.blocked_by,
                    "hidden": chat.hidden_by,
                    "friends": chat.friends,
                    "forceUpdate": True,
                }
            )

        # print("Chat list", chat_list)
        end_time = time.time()
        # print(f"Query took {end_time - start_time} seconds")
        return jsonify({"chats": chat_list}), 200

    except Exception as e:
        # print(str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/serve-user-data", methods=["GET"])
def serve_user_data():
    try:
        # TODO perhaps create decorator for authentication as
        user_id = request.args.get("userId")
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        if user_id is None:
            if auth_token is None:
                return jsonify({"message": "Unauthorized access"}), 401
            user_id = decoded["id"]

        user = User.query.filter_by(id=user_id).first()
        if user:
            return (
                jsonify(
                    {
                        "id": user.id,
                        "username": user.username,
                        "interests": user.interests,
                        "description": user.description,
                        "pfp": user.profile_picture,
                        "opendms": user.open_dms,
                        "location": user.location,
                        "age": user.age,
                        "sex": user.sex,
                        "strikes": user.strike,
                    }
                ),
                200,
            )
        else:
            return jsonify({"message": "User not found"}), 404
    except Exception as e:
        # print("serve user data", str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/getmessages", methods=["GET"])
def serve_message_data():
    try:
        auth_token = request.headers.get("Authorization")
        decoded = jwt.decode(auth_token, app.config["SECRET_KEY"], algorithms="HS256")
        id = decoded["id"]
        chat_id = request.args.get("chat_id")
        after_timestamp = request.args.get("after_timestamp")  # new query parameter

        association = UserChat.query.filter(
            UserChat.user_id == id, UserChat.chat_id == chat_id
        ).first()

        if association:
            if after_timestamp:
                messages = Message.query.filter(
                    Message.chat_id == chat_id,
                    Message.timestamp
                    > after_timestamp,  # only messages after this timestamp
                ).all()
            else:
                messages = Message.query.filter_by(chat_id=chat_id).all()

            message_list = []
            for message in messages:
                message_list.append(
                    {
                        "id": message.id,
                        "sender_id": message.sender_id,
                        "content": message.content,
                        "timestamp": message.timestamp,
                        "type": message.type,
                    }
                )
            return jsonify({"messages": message_list}), 200
        else:
            return jsonify({"message": "Unauthorized."}), 403

    except Exception as e:
        # print(str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/register", methods=["POST"])
def register_user():
    data = request.json

    username = data.get("username")  # todo perhaps implement discord style #1234

    password = data.get("password")
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    profile_picture = data.get("pfp")
    age = data.get("age")
    sex = data.get("sex")
    location = data.get("location")
    token = data.get("token")

    new_user = User(
        username=username,
        expo_push_token=token,
        password=hashed_password,
        interests="",
        description="",
        profile_picture=profile_picture,
        open_dms=True,
        age=age,
        sex=sex,
        location=location,
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        # print("username is", username, "password is", password)
        return (
            jsonify(
                {"message": "User registered successfully!", "userId": new_user.id}
            ),
            200,
        )
    except Exception as e:
        # print("EXCEPTION AS E", e)

        db.session.rollback()
        return jsonify({"message": "An error occurred."})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    id = data.get("id")
    password = data.get("password")
    # Debug log - remove sensitive data in production
    # print("Logging in....")

    user = User.query.filter_by(id=id).first()

    if user and bcrypt.check_password_hash(user.password, password):
        # Check if user is banned
        if user.banned is not None:
            if user.banned > datetime.utcnow():
                formatted_datetime = user.banned.strftime("%d/%m/%Y at %H:%M UTC")
                return (
                    jsonify(
                        {
                            "message": "User is banned",
                            "reason": user.banned_for,
                            "duration": formatted_datetime,
                        }
                    ),
                    403,
                )
            else:
                try:
                    user.banned = None
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    # print(f"An error occurred: {str(e)}")
                    return jsonify({"message": "Database error"}), 500

        # Check if a warning needs to be displayed
        display_warning = False
        if user.warning is not None:
            display_warning = user.warning

        payload = {"id": user.id, "username": user.username}
        auth_token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

        return (
            jsonify(
                {
                    "message": "login successful",
                    "token": auth_token,
                    "displayWarning": display_warning,
                }
            ),
            200,
        )
    else:
        return jsonify({"message": "Invalid credentials"}), 400


@app.route("/upload", methods=["POST"])
def handle_upload():
    # print("uploading started....")
    file_type = request.form.get("fileType", "image")
    # print("file type is", file_type)

    if file_type not in request.files:
        # print(f'No {file_type} part.')
        return jsonify({"message": f"No {file_type} part."}), 400

    file = request.files[file_type]
    if file.filename == "":
        # print(f'No selected {file_type}')
        return jsonify({"message": f"No selected {file_type}"}), 400

    # print(f"\n\n\n{file_type.upper()} IS:", file, "\n\n\n")

    url = upload_file(file)
    # print(f"Uploaded {file_type}", url)

    return (
        jsonify(
            {"message": f"{file_type.capitalize()} uploaded successfully", "url": url}
        ),
        200,
    )


def upload_file(file):
    try:
        s3.upload_fileobj(
            file,
            "imagesending",
            file.filename,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        pass
        # print("in upload file", str(e))

    cloudfront_url = f"https://d1zmmxvc41334f.cloudfront.net/{file.filename}"

    return cloudfront_url


@socketio.on("connect")
def handle_connect(*args, **kwargs):
    # print(f"Arguments: {args}, Keyword Arguments: {kwargs}")  # Debug line
    id = request.args.get("userId")
    # print(f"Received ID: {id}")  # Debug line

    if id is None or id == "undefined":
        # print("ID is undefined or None.")  # Debug line
        return  # You may choose to disconnect the socket here if the ID is invalid

    join_room(f"user_{id}")

    user = User.query.filter_by(id=id).first()
    if user:
        user.online = True
        user.last_seen = datetime.utcnow()
        db.session.commit()
        emit_user_status(user)

    # print(f'Client connected to room user_{id}.')


def emit_user_status(user, pfp=0):
    # todo think about scalability, maybe put both ids in the userchat
    user_chats = UserChat.query.filter_by(user_id=user.id).all()
    chatmates = []
    for chat in user_chats:
        emit(
            "user_status_update_chat",
            {
                "userId": user.id,
                "online": user.online,
                "last_seen": user.last_seen.isoformat(),
                "pfp": pfp if pfp != 0 else user.profile_picture,
            },
            room=f"chat_{chat.id}",
        )
        query = Chat.query.filter_by(id=chat.chat_id).first()
        if query.user1 != user.id:
            chatmates.append(query.user1)
        else:
            chatmates.append(query.user2)
    for chatmate in chatmates:
        emit(
            "user_status_update",
            {
                "userId": user.id,
                "online": user.online,
                "last_seen": user.last_seen.isoformat(),
                "pfp": pfp if pfp != 0 else user.profile_picture,
            },
            room=f"user_{chatmate}",
        )


@socketio.on("pfp_update")
def handle_pfp_update(data):
    user_id = data["userId"]
    pfp = data["pfp"]
    user = User.query.get(user_id)
    if user:
        emit_user_status(user=user, pfp=pfp)
        socketio.emit("updated_own_pfp", {"pfp": pfp}, room=f"user_{user_id}")


@socketio.on("join_room")
def handle_join_room(data):
    # print(data, data["room"])
    room = f'chat_{data["room"]}'
    join_room(room)
    # print(f"User joined room {room}.")


@socketio.on("leave_room")
def handle_leave_room(data):
    room = f'chat_{data["room"]}'
    leave_room(room)
    # print(f'User left room {room}.')


@socketio.on("disconnect")
def handle_disconnect():
    id = request.args.get("userId")
    user = User.query.filter_by(id=id).first()
    if user:
        user.online = False
        user.last_seen = datetime.utcnow()
        db.session.commit()

        emit_user_status(user)

    # print(f'\n\n\nClient disconnected: {id}\n\n\n')


@socketio.on("send_message")
def handle_send_message(data):
    # print("calling send message", data)
    chat_id = data["chat_id"]
    sender_id = data["sender_id"]
    content = data["content"]
    username = data["username"]
    timestamp = data["timestamp"]
    pfp = data["pfp"]
    type = data["type"]

    # add to database
    new_message = Message(
        chat_id=chat_id,
        sender_id=sender_id,
        content=content,
        timestamp=timestamp,
        type=type,
    )
    db.session.add(new_message)
    chat = Chat.query.filter_by(id=chat_id).first()
    if chat:
        chat.last_message = content if len(content) < 25 else content[:25] + "..."
        chat.last_message_type = type
        chat.unread_messages += 1
        chat.last_sender = sender_id
        if chat.hidden_by != 0:
            chat.hidden_by = 0
    db.session.commit()
    receiver_id = chat.user1 if chat.user1 != chat.last_sender else chat.user2
    receiver = User.query.get(receiver_id)
    receiver_token = receiver.expo_push_token
    emit(
        "new_last_message",
        {
            "type": type,
            "chatId": chat_id,
            "title": username,
            "otherId": sender_id,
            "lastMessage": content if len(content) < 25 else content[:25] + "...",
            "lastMessageDate": timestamp,
            "unreadMessages": chat.unread_messages,
            "pfp": pfp,
            "senderId": sender_id,
            "online": True,
        },
        room=f"user_{receiver_id}",
    )

    emit(
        "new_last_message",
        {
            "type": type,
            "chatId": chat_id,
            "title": receiver.username,
            "otherId": receiver_id,
            "lastMessage": content if len(content) < 25 else content[:25] + "...",
            "lastMessageDate": timestamp,
            "unreadMessages": chat.unread_messages,
            "pfp": receiver.profile_picture,
            "senderId": sender_id,
            "online": receiver.online,
        },
        room=f"user_{sender_id}",
    )

    # print(f"Emissions made: \n\n To user_{receiver_id}", {'type': type,
    # 'chatId': chat_id,
    # 'title': username,
    # 'otherId': sender_id,
    # 'lastMessage': content if len(content) < 25 else content[:25] + '...',
    # 'lastMessageDate': timestamp,
    # 'unreadMessages': chat.unread_messages,
    # 'pfp': pfp,
    # 'senderId': sender_id,
    # }, f"\n\nANd to user_{sender_id}", {
    # 'type': type,
    # 'chatId': chat_id,
    # 'title': receiver.username,
    # 'otherId': receiver_id,
    # 'lastMessage': content if len(content) < 25 else content[:25] + '...',
    # 'lastMessageDate': timestamp,
    # 'unreadMessages': chat.unread_messages,
    # 'pfp': receiver.profile_picture,
    # 'senderId': sender_id
    # })

    emit("new_message", data, room=f"chat_{chat_id}")
    emit("new_message_user", data, room=f"user_{sender_id}")
    emit("new_message_user", data, room=f"user_{receiver_id}")

    send_push_message(receiver_token, username, content)


@socketio.on("message_read")
def handle_message_read(data):
    chat_id = data["chat_id"]
    other_id = data["other_id"]

    chat = Chat.query.filter_by(id=chat_id).first()
    chat.unread_messages = 0
    db.session.commit()

    # print("MESSAGE READ IN ", chat_id)

    emit("message_read_chat", {"chatId": chat_id}, room=f"chat_{chat_id}")
    emit("message_read_user", {"chatId": chat_id}, room=f"user_{other_id}")
    emit("message_read_user", {"chatId": chat_id}, room=f'user_{data["userId"]}')


@socketio.on("user_typing")
def handle_user_typing(data):
    chat_id = data["chat_id"]
    user_id = data["user_id"]
    other_id = data["other_id"]
    emit("user_typing", {"userId": user_id}, room=f"chat_{chat_id}")
    emit("user_typing", {"chatId": chat_id}, room=f"user_{other_id}")


@socketio.on("user_stopped_typing")
def handle_user_typing(data):
    chat_id = data["chat_id"]
    user_id = data["user_id"]
    other_id = data["other_id"]
    emit("user_stopped_typing", {"userId": user_id}, room=f"chat_{chat_id}")
    emit("user_stopped_typing", {"chatId": chat_id}, room=f"user_{other_id}")


@socketio.on("block")
def handle_block(data):
    chat_id = data["chat_id"]
    id = data["user_id"]
    other_id = data["other_id"]
    chat = Chat.query.get(chat_id)
    if chat:
        chat.blocked_by = id
        chat.friends = 0
    new_block = BlockList(blocker=id, blocked=other_id)
    db.session.add(new_block)
    db.session.commit()

    # print("User blocked.")

    emit("user_blocked", {"chatId": chat_id, "blockerId": id}, room=f"user_{other_id}")
    emit("user_blocked_chat", room=f"chat_{chat_id}")


@socketio.on("unblock")
def handle_unblock(data):
    chat_id = data["chat_id"]
    id = data["user_id"]
    other_id = data["other_id"]
    chat = Chat.query.get(chat_id)
    if chat:
        chat.blocked_by = 0
    block_entry = BlockList.query.filter_by(blocker=id, blocked=other_id).first()
    if block_entry:
        db.session.delete(block_entry)

    db.session.commit()

    # print("User unblocked.")

    emit("user_unblocked", {"chatId": chat_id}, room=f"user_{other_id}")
    emit("user_unblocked", {"chatId": chat_id}, room=f"user_{id}")


@socketio.on("add_friend")
def handle_add_friend(data):
    chat_id = data["chat_id"]
    id = data["user_id"]
    other_id = data["other_id"]

    chat = Chat.query.get(chat_id)
    if chat:
        chat.friends = id if chat.friends == 0 else -1
        db.session.commit()
    emit("add_friend_chat", {"newFriends": chat.friends}, room=f"chat_{chat_id}")
    emit(
        "add_friend_user",
        {"chatId": chat_id, "newFriends": chat.friends},
        room=f"user_{other_id}",
    )
    emit(
        "add_friend_user",
        {"chatId": chat_id, "newFriends": chat.friends},
        room=f"user_{id}",
    )


@socketio.on("unadd_friend")
def handle_unadd_friend(data):
    # print("\n\nHandling unadd friend...\n\n")
    chat_id = data["chat_id"]
    other_id = data["other_id"]
    # print("\n\nChat Id for unadd_friend is: ", chat_id, "\n\nAnd other_id: ", other_id, "\n\n")

    chat = Chat.query.get(chat_id)
    if chat:
        chat.friends = 0
        db.session.commit()
    emit("unadd_friend_chat", room=f"chat_{chat_id}")
    emit("unadd_friend_user", {"chatId": chat_id}, room=f"user_{other_id}")
    emit("unadd_friend_user", {"chatId": chat_id}, room=f'user_{data["user_id"]}')

    # print(f"\n\nEmitted unadd friend to rooms: (1)chat_{chat_id}, (2) user_{other_id}")


def send_push_message(token, sender_username, message):
    headers = {
        "host": "exp.host",
        "Content-Type": "application/json",
        "accept": "application/json",
    }
    body = {"to": token, "title": sender_username, "body": message}
    # print("Sending push notifications...")
    requests.post("https://exp.host/--/api/v2/push/send", json=body, headers=headers)


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)
