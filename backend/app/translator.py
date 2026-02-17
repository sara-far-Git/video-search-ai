from deep_translator import GoogleTranslator


def translate_to_english(text: str):
    try:
        translated = GoogleTranslator(
            source="auto",
            target="en"
        ).translate(text)

        return translated.lower()

    except Exception:
        return text.lower()
