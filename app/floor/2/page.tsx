import { redirect } from "next/navigation";

import { MuseumExperience } from "@/components/museum/museum-experience";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getExhibits } from "@/features/exhibits/queries/get-exhibits";

export default async function SecondFloorPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in?next=/floor/2");
  const exhibits = await getExhibits();
  return <MuseumExperience initialExhibits={exhibits} currentUser={currentUser} />;
}
