import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Automatically redirect to quote page
    setLocation("/cotizar");
  }, [setLocation]);

  return null; // No need to render anything since we redirect immediately
}
