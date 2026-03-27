from keybert import KeyBERT
from Backend.src.main.python.helper_files.tags_util import ALLOWED_TAGS
from Backend.src.main.python.helper_files.tags_mapping_util import TAG_MAPPING

kw_model = KeyBERT()

def generate_tags(name: str, description: str):
    text = f"{name}. {description}"

    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 1),
        stop_words='english',
        top_n=10
    )

    raw_tags = [kw[0].lower() for kw in keywords]

    final_tags = set()

    for tag in raw_tags:
        if tag in TAG_MAPPING:
            mapped = TAG_MAPPING[tag]
            if mapped in ALLOWED_TAGS:
                final_tags.add(mapped)

    return list(final_tags)