from keybert import KeyBERT

kw_model = KeyBERT()

def generate_tags(name: str, description: str):
    text = f"{name}. {description}"

    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),
        stop_words='english',
        top_n=5
    )

    return [kw[0] for kw in keywords]