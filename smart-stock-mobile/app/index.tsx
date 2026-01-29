
import { Redirect } from "expo-router";

import SmartStockLogo from "../../assets/SmartStockLogo.png";

export default function Index() {
  // On app start, always go to the login screen
  return <Redirect href="/auth/login" />;
}
