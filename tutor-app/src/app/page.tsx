import { CURRICULUM } from "@/lib/curriculum.generated";
import TutorApp from "@/components/TutorApp";

export default function Home() {
  return <TutorApp materials={CURRICULUM} />;
}
