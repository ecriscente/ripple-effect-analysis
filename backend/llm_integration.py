import os
import time
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Configure the Generative AI model
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Generative Model
model = genai.GenerativeModel('gemini-2.5-flash')

def _read_prompt_from_file(filename: str, lang: str = 'en') -> str:
    """
    Reads a prompt template from a specified file for a given language.
    """
    filepath = os.path.join(os.path.dirname(__file__), "prompts", lang, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def parse_llm_response(text: str) -> list[str]:
    """
    Parses the LLM's response into a list of strings, assuming bullet points.
    """
    # Split by newline and filter out empty strings
    points = [line.strip() for line in text.split('\n') if line.strip()]
    # Remove common bullet point markers if present
    return [point.lstrip('-* ' ) for point in points]

def validate_technology(technology: str, lang: str = 'en') -> bool:
    """
    Validates if the given technology is a valid emerging technology using LLM.
    """
    validation_prompt_template = _read_prompt_from_file('validate_technology.txt', lang)
    validation_prompt = validation_prompt_template.format(technology=technology)
    print(f"Validation Prompt: {validation_prompt}")  # Debugging line
    try:
        response = model.generate_content(validation_prompt)
        answer = response.text.strip().lower()
        print(f"LLM Response: {answer}")  # Debugging line
        return answer in ['yes', 'sim']
    except Exception as e:
        print(f"Error during technology validation: {e}")
        return False # Assume invalid on error

def get_analysis(technology: str, lang: str = 'en'):
    """
    This function calls a Large Language Model 
    using the Ripple Effect Analysis framework.
    """

    # Load master prompts from files based on language
    prompt1_primary_ripples_template = _read_prompt_from_file('primary_ripples.txt', lang)
    prompt2_secondary_ripples_template = _read_prompt_from_file('secondary_ripples.txt', lang)
    prompt3_synthesis_template = _read_prompt_from_file('synthesis.txt', lang)

    # Format prompts with the technology
    prompt1_primary_ripples = prompt1_primary_ripples_template.format(technology=technology)
    prompt2_secondary_ripples = prompt2_secondary_ripples_template.format(technology=technology)
    prompt3_synthesis = prompt3_synthesis_template.format(technology=technology)

    # Define localized titles
    titles = {
        'en': {
            'primary_ripples': f"Primary Ripples for {technology}",
            'secondary_ripples': f"Secondary Ripples for {technology}",
            'synthesis': f"Opportunities for {technology}"
        },
        'pt': {
            'primary_ripples': f"Ondas Primárias para {technology}",
            'secondary_ripples': f"Ondas Secundárias para {technology}",
            'synthesis': f"Oportunidades para {technology}"
        }
    }

    # Call the LLM for each prompt
    try:
        response1 = model.generate_content(prompt1_primary_ripples)
        primary_ripples_points = parse_llm_response(response1.text)

        response2 = model.generate_content(prompt2_secondary_ripples)
        secondary_ripples_points = parse_llm_response(response2.text)

        response3 = model.generate_content(prompt3_synthesis)
        synthesis_points = parse_llm_response(response3.text)

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        primary_ripples_points = ["Error: An unexpected error occurred. Please try again later."]
        secondary_ripples_points = ["Error: An unexpected error occurred. Please try again later."]
        synthesis_points = ["Error: An unexpected error occurred. Please try again later."]

    return {
        "primary_ripples": {
            "title": titles[lang]['primary_ripples'],
            "points": primary_ripples_points
        },
        "secondary_ripples": {
            "title": titles[lang]['secondary_ripples'],
            "points": secondary_ripples_points
        },
        "synthesis": {
            "title": titles[lang]['synthesis'],
            "points": synthesis_points
        }
    }

if __name__ == "__main__":
    # Example usage:
    test_technology = "Artificial Intelligence"
    print(f"\n--- Testing get_analysis for {test_technology} (English) ---")
    try:
        analysis_output_en = get_analysis(test_technology, lang='en')
        print("Analysis successful!")
        print("Primary Ripples (EN):", analysis_output_en["primary_ripples"]["title"], analysis_output_en["primary_ripples"]["points"][:2])
        print("Secondary Ripples (EN):", analysis_output_en["secondary_ripples"]["title"], analysis_output_en["secondary_ripples"]["points"][:2])
        print("Synthesis (EN):", analysis_output_en["synthesis"]["title"], analysis_output_en["synthesis"]["points"][:2])
    except Exception as e:
        print(f"Error during English test: {e}")

    print(f"\n--- Testing get_analysis for {test_technology} (Portuguese) ---")
    try:
        analysis_output_pt = get_analysis(test_technology, lang='pt')
        print("Analysis successful!")
        print("Primary Ripples (PT):", analysis_output_pt["primary_ripples"]["title"], analysis_output_pt["primary_ripples"]["points"][:2])
        print("Secondary Ripples (PT):", analysis_output_pt["secondary_ripples"]["title"], analysis_output_pt["secondary_ripples"]["points"][:2])
        print("Synthesis (PT):", analysis_output_pt["synthesis"]["title"], analysis_output_pt["synthesis"]["points"][:2])
    except Exception as e:
        print(f"Error during Portuguese test: {e}")

    print(f"\n--- Testing validate_technology for {test_technology} (English) ---")
    is_valid = validate_technology(test_technology, lang='en')
    print(f"Is '{test_technology}' a valid technology? {is_valid}")

    test_invalid_technology = "asdfasdfasdf"
    print(f"\n--- Testing validate_technology for {test_invalid_technology} (English) ---")
    is_valid = validate_technology(test_invalid_technology, lang='en')
    print(f"Is '{test_invalid_technology}' a valid technology? {is_valid}")
