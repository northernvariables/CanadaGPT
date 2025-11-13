"""TF-IDF keyword extraction for Hansard documents.

This module extracts keywords from parliamentary debates and committee evidence
using Term Frequency-Inverse Document Frequency (TF-IDF) with a session-based corpus.
"""

from typing import List, Dict, Any, Optional
import json
import re
from collections import Counter
import math

from ..utils.progress import logger


# Parliamentary stop words (common terms in Hansard that aren't meaningful keywords)
PARLIAMENTARY_STOPWORDS = {
    # English stop words
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
    'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
    'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
    'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
    'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
    'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
    'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
    'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
    'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has',
    'had', 'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being', 'very',

    # Parliamentary-specific terms
    'mr', 'mrs', 'ms', 'hon', 'honourable', 'member', 'members', 'speaker', 'chair',
    'chairman', 'chairwoman', 'chairperson', 'madam', 'sir', 'committee', 'house',
    'commons', 'parliament', 'parliamentary', 'motion', 'question', 'answer',
    'minister', 'prime', 'opposition', 'liberal', 'conservative', 'ndp', 'bloc',
    'green', 'party', 'riding', 'constituency', 'vote', 'voted', 'voting',

    # French stop words (common in bilingual debates)
    'le', 'la', 'les', 'de', 'un', 'une', 'des', 'du', 'et', 'en', 'à', 'dans',
    'pour', 'que', 'qui', 'par', 'sur', 'avec', 'au', 'ce', 'cette', 'ces',
    'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'mon', 'ma', 'mes',
    'son', 'sa', 'ses', 'notre', 'nos', 'leur', 'leurs', 'est', 'sont', 'été',
    'avoir', 'être', 'faire', 'dit', 'ça', 'tout', 'tous', 'toute', 'toutes',
    'député', 'députée', 'députés', 'ministre', 'président', 'présidente',
    'monsieur', 'madame', 'mesdames', 'messieurs', 'comité', 'chambre',
}


def tokenize_text(text: str) -> List[str]:
    """
    Tokenize text into words, removing punctuation and converting to lowercase.

    Args:
        text: Input text

    Returns:
        List of lowercase tokens
    """
    if not text:
        return []

    # Convert to lowercase
    text = text.lower()

    # Remove possessives
    text = re.sub(r"'s\b", '', text)

    # Split on non-alphanumeric characters (keeps accented characters)
    tokens = re.findall(r'\b[\w\-]+\b', text, re.UNICODE)

    # Filter out:
    # - Stop words
    # - Single characters
    # - Numbers
    # - Very short words (< 3 chars)
    tokens = [
        token for token in tokens
        if token not in PARLIAMENTARY_STOPWORDS
        and len(token) >= 3
        and not token.isdigit()
    ]

    return tokens


def calculate_term_frequency(tokens: List[str]) -> Dict[str, float]:
    """
    Calculate term frequency (TF) for tokens.

    TF = (number of times term appears in document) / (total terms in document)

    Args:
        tokens: List of tokens from document

    Returns:
        Dictionary mapping terms to their TF scores
    """
    if not tokens:
        return {}

    total_tokens = len(tokens)
    term_counts = Counter(tokens)

    return {
        term: count / total_tokens
        for term, count in term_counts.items()
    }


def calculate_inverse_document_frequency(
    corpus_term_counts: Dict[str, int],
    total_documents: int
) -> Dict[str, float]:
    """
    Calculate inverse document frequency (IDF) for terms across corpus.

    IDF = log(total documents / documents containing term)

    Args:
        corpus_term_counts: Dict mapping terms to number of documents containing them
        total_documents: Total number of documents in corpus

    Returns:
        Dictionary mapping terms to their IDF scores
    """
    if total_documents == 0:
        return {}

    return {
        term: math.log(total_documents / doc_count)
        for term, doc_count in corpus_term_counts.items()
        if doc_count > 0
    }


def extract_keywords_tfidf(
    document_text: str,
    corpus_term_counts: Dict[str, int],
    total_documents: int,
    top_n: int = 20
) -> List[Dict[str, Any]]:
    """
    Extract top keywords from document using TF-IDF.

    Args:
        document_text: Full text content of the document
        corpus_term_counts: Map of terms to number of corpus documents containing them
        total_documents: Total documents in corpus (for IDF calculation)
        top_n: Number of top keywords to return

    Returns:
        List of dicts with 'word' and 'weight' keys, sorted by weight descending
    """
    # Tokenize document
    tokens = tokenize_text(document_text)

    if not tokens:
        logger.warning("No tokens found in document text")
        return []

    # Calculate TF
    tf = calculate_term_frequency(tokens)

    # Calculate IDF for corpus
    idf = calculate_inverse_document_frequency(corpus_term_counts, total_documents)

    # Calculate TF-IDF scores
    tfidf_scores = {}
    for term, tf_score in tf.items():
        # Use IDF if available, otherwise use a default value (term appears in 1 document only)
        idf_score = idf.get(term, math.log(total_documents))
        tfidf_scores[term] = tf_score * idf_score

    # Sort by score and get top N
    sorted_terms = sorted(
        tfidf_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_n]

    # Normalize weights to 0-1 range
    if sorted_terms:
        max_weight = sorted_terms[0][1]
        if max_weight > 0:
            keywords = [
                {
                    'word': term,
                    'weight': round(score / max_weight, 3)
                }
                for term, score in sorted_terms
            ]
        else:
            keywords = [{'word': term, 'weight': 0.0} for term, _ in sorted_terms]
    else:
        keywords = []

    return keywords


def build_session_corpus(
    session_documents: List[Dict[str, Any]]
) -> Dict[str, int]:
    """
    Build term document frequency counts for a session corpus.

    Args:
        session_documents: List of documents from same session, each with 'text' key

    Returns:
        Dictionary mapping terms to number of documents containing them
    """
    corpus_term_counts = Counter()

    for doc in session_documents:
        text = doc.get('text', '')
        if not text:
            continue

        # Get unique terms in this document
        tokens = tokenize_text(text)
        unique_terms = set(tokens)

        # Increment document count for each unique term
        for term in unique_terms:
            corpus_term_counts[term] += 1

    return dict(corpus_term_counts)


def extract_document_keywords(
    document_text_en: Optional[str],
    document_text_fr: Optional[str],
    session_corpus_en: List[Dict[str, Any]],
    session_corpus_fr: List[Dict[str, Any]],
    top_n: int = 20
) -> tuple[Optional[str], Optional[str]]:
    """
    Extract keywords from document in both languages.

    Args:
        document_text_en: English text content
        document_text_fr: French text content
        session_corpus_en: List of English documents from same session
        session_corpus_fr: List of French documents from same session
        top_n: Number of keywords to extract per language

    Returns:
        Tuple of (keywords_en_json, keywords_fr_json)
    """
    keywords_en = None
    keywords_fr = None

    # Extract English keywords
    if document_text_en and session_corpus_en:
        corpus_counts_en = build_session_corpus(session_corpus_en)
        keywords_list_en = extract_keywords_tfidf(
            document_text_en,
            corpus_counts_en,
            len(session_corpus_en),
            top_n=top_n
        )
        if keywords_list_en:
            keywords_en = json.dumps(keywords_list_en, ensure_ascii=False)

    # Extract French keywords
    if document_text_fr and session_corpus_fr:
        corpus_counts_fr = build_session_corpus(session_corpus_fr)
        keywords_list_fr = extract_keywords_tfidf(
            document_text_fr,
            corpus_counts_fr,
            len(session_corpus_fr),
            top_n=top_n
        )
        if keywords_list_fr:
            keywords_fr = json.dumps(keywords_list_fr, ensure_ascii=False)

    return keywords_en, keywords_fr
