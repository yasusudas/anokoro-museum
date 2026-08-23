import { notFound, redirect } from "next/navigation";

import { MuseumExperience } from "@/components/museum/museum-experience";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import {
  getFloorIdFromPathSegment,
  getFloorPath,
} from "@/features/exhibits/floors";
import {
  getExhibits,
  getFirstFloorExhibits,
} from "@/features/exhibits/queries/get-exhibits";

export default async function FloorPage({ params }: PageProps<"/floor/[floorId]">) {
  const { floorId: pathSegment } = await params;
  const floorId = getFloorIdFromPathSegment(pathSegment);

  if (!floorId) notFound();

  const currentUser = await getCurrentUser();

  if (floorId === "1F") {
    const exhibits = await getFirstFloorExhibits();
    return (
      <MuseumExperience
        initialExhibits={exhibits}
        initialFloorId={floorId}
        currentUser={currentUser}
        isPreview
      />
    );
  }

  if (!currentUser) {
    redirect(`/sign-in?next=${encodeURIComponent(getFloorPath(floorId))}`);
  }

  const exhibits = floorId === "B2F"
    ? await getExhibits({ userId: currentUser.id })
    : await getExhibits();
  return (
    <MuseumExperience
      initialExhibits={exhibits}
      initialFloorId={floorId}
      currentUser={currentUser}
    />
  );
}
