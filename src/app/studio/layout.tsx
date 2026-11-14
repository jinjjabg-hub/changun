import { fontFaceCss } from "@/studio/fonts";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
      {children}
    </>
  );
}
