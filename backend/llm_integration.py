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
model = genai.GenerativeModel('gemini-1.5-flash')

def _read_prompt_from_file(filename: str) -> str:
    """
    Reads a prompt template from a specified file.
    """
    filepath = os.path.join(os.path.dirname(__file__), "prompts", filename)
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

def get_analysis(technology: str):
    """
    This function calls a Large Language Model 
    using the Ripple Effect Analysis framework.
    """

    # Load master prompts from files
    prompt1_primary_ripples_template = _read_prompt_from_file('primary_ripples.txt')
    prompt2_secondary_ripples_template = _read_prompt_from_file('secondary_ripples.txt')
    prompt3_synthesis_template = _read_prompt_from_file('synthesis.txt')

    # Format prompts with the technology
    prompt1_primary_ripples = prompt1_primary_ripples_template.format(technology=technology)
    prompt2_secondary_ripples = prompt2_secondary_ripples_template.format(technology=technology)
    prompt3_synthesis = prompt3_synthesis_template.format(technology=technology)

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
            "title": f"Primary Ripples for {technology}",
            "points": primary_ripples_points
        },
        "secondary_ripples": {
            "title": f"Secondary Ripples for {technology}",
            "points": secondary_ripples_points
        },
        "synthesis": {
            "title": f"Synthesis for {technology}",
            "points": synthesis_points
        }
    }

if __name__ == "__main__":
    # Example usage:
    test_technology = "Artificial Intelligence"
    print(f"\n--- Testing get_analysis for {test_technology} ---")
    try:
        analysis_output = get_analysis(test_technology)
        print("Analysis successful!")
        print("Primary Ripples:", analysis_output["primary_ripples"]["points"][:2]) # Print first 2 points
        print("Secondary Ripples:", analysis_output["secondary_ripples"]["points"][:2]) # Print first 2 points
        print("Synthesis:", analysis_output["synthesis"]["points"][:2]) # Print first 2 points
    except Exception as e:
        print(f"Error during test: {e}")