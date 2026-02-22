const ITALIC_MAP: Record<string, string> = {
  Montserrat_900Black: 'Montserrat_900Black_Italic',
  Montserrat_700Bold: 'Montserrat_700Bold_Italic',
  Montserrat_600SemiBold: 'Montserrat_600SemiBold_Italic',
  Inter_400Regular: 'Inter_400Regular_Italic',
  Inter_500Medium: 'Inter_500Medium_Italic',
  Inter_600SemiBold: 'Inter_600SemiBold_Italic',
};

export function getItalicFontFamily(fontFamily?: string): string | undefined {
  if (!fontFamily) return fontFamily;
  return ITALIC_MAP[fontFamily] ?? fontFamily;
}
