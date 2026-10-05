import { BirthyApp } from "@/components/birthy/birthy-app";
export default function Page() { return <BirthyApp initialNow={new Date().toISOString()} />; }
