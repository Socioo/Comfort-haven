import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="contact-social" options={{ headerShown: true, title: 'Contact & Social Info', headerTintColor: Colors.black, headerTitleStyle: { fontWeight: 'bold', color: Colors.black } }} />
    </Stack>
  );
}
