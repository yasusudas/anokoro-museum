import { MuseumExperience } from "@/components/museum/museum-experience";
import { getExhibits } from "@/features/exhibits/queries/get-exhibits";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";

export default async function Home() {
  const [exhibits, user] = await Promise.all([
    getExhibits(),
    getCurrentUser(),
  ]);

  return (
    <MuseumExperience
      initialExhibits={exhibits}
      currentUser={user}
    />
  );
}
