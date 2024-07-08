import React, { createContext, useState, useEffect, useContext } from 'react';
import { InterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';

// Create Context Object
export const AdContext = createContext();

// Create a provider for components to consume and subscribe to changes
export const AdContextProvider = ({ children }) => {
  const [searchClickCount, setSearchClickCount] = useState(0);
  const [chatClickCount, setChatClickCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [needsShow, setNeedsShow] = useState(false);

  const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true,
    keywords: ['social media', 'apps', 'games'],
  });

  
  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);

      if (needsShow) {
        interstitial.show();
        setLoaded(false);
        setNeedsShow(false);
        interstitial.load(); // Load the next ad
      }
    });

    interstitial.load();

    return () => {
      unsubscribe();
    };
  }, [needsShow]);

  const handleSearchClick = () => {
    const newSearchCount = searchClickCount + 1;
    setSearchClickCount(newSearchCount);

    if (newSearchCount % 3 === 0) {
      setNeedsShow(true);
      setSearchClickCount(0); // Reset the count
    }
  };

  const handleChatClick = () => {
    const newChatCount = chatClickCount + 1;
    setChatClickCount(newChatCount);

    if (newChatCount % 10 === 0) {
      setNeedsShow(true);
      setChatClickCount(0); // Reset the count
    }
  };

  return (
    <AdContext.Provider
      value={{
        handleSearchClick,
        handleChatClick,
        loaded,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

// Create a hook for components to easily use the context
export const useAds = () => {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdContextProvider');
  }
  return context;
};
