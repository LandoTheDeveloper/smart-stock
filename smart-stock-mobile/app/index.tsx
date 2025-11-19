
import { Redirect } from "expo-router";

export default function Index() {
  // On app start, always go to the login screen
  return <Redirect href="/auth/login" />;
}
