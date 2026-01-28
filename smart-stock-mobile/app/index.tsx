
import { Redirect } from "expo-router";
import { useEffect } from 'react';

import SmartStockLogo from "../../assets/SmartStockLogo.png";

export default function Index() {

  // On app start, change the name of the webpage to "SmartStock" and the favicon to "SmartStockLogo.png"
  useEffect(() => {document.title = "SmartStock";}, []);

  // On app start, always go to the login screen
  return <Redirect href="/auth/login" />;
}
