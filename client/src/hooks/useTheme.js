import { useCallback, useEffect, useState } from "react";

export const useTheme = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("scTheme");
    const initial = stored || "light";
    document.documentElement.setAttribute("data-bs-theme", initial);
    setTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-bs-theme", next);
      localStorage.setItem("scTheme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
};
