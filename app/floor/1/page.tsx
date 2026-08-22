import { MuseumExperience } from "@/components/museum/museum-experience";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getFirstFloorExhibits } from "@/features/exhibits/queries/get-exhibits";

export default async function FirstFloorPage() {
  const [exhibits, currentUser] = await Promise.all([getFirstFloorExhibits(), getCurrentUser()]);
  return <MuseumExperience initialExhibits={exhibits} currentUser={currentUser} isPreview />;
}
