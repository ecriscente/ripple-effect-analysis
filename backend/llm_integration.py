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

    # Master prompts from the framework guide
    prompt1_primary_ripples = f"""Analyze the emerging technology known as {technology}.

    Based on publicly available information, identify the primary, direct consequences of this technology's adoption. Focus on the following four areas:

    1.  **Core Capabilities:** What are the fundamental new capabilities this technology unlocks? What is possible now that wasn't before?
    2.  **Automation & Efficiency:** What existing human tasks or processes can be automated or made significantly more efficient by this technology?
    3.  **New Markets & Platforms:** What entirely new products, services, or platforms can be built directly on top of these new capabilities?
    4.  **Immediate Integration:** How is this technology being integrated into existing business functions today (e.g., marketing, finance, operations, R&D)?

    Synthesize these findings into a concise overview of the immediate business and technological landscape created by {technology}. Present the findings as a list of bullet points, with each point starting with a bolded title (e.g., **Core Capabilities:**).
    """

    prompt2_secondary_ripples = f"""Now, analyze the human and societal reaction to the widespread adoption of {technology}.

    Consider the "Secondary Ripples"—the indirect consequences that emerge as society adapts to the changes brought by this technology. Focus on the following five areas:

    1.  **Skills & Value Shift:** As this technology automates certain tasks, what uniquely human skills, abilities, or qualities become *more* valuable and in-demand?
    2.  **Social & Community Impact:** How does this technology affect the way people connect with each other? Does it foster community or isolation? What new forms of social interaction might emerge?
    3.  **Search for Meaning & Purpose:** How does this technology impact the human search for purpose, creativity and fulfillment? Does it create new avenues for self-actualization or does it challenge existing ones?
    4.  **New Fears & Anxieties:** What are the primary ethical, social, or personal anxieties that arise from this technology's use? (e.g., job security, privacy, loss of human connection).
    5.  **Lifestyle & Behavioral Changes:** What are the likely long-term changes to daily routines, lifestyles, or consumption habits as a result of this technology?

    Synthesize these findings into a concise overview of the emerging human needs and societal shifts in the age of {technology}. Present the findings as a list of bullet points, with each point starting with a bolded title (e.g., **Skills & Value Shift:**).
    """

    prompt3_synthesis = f"""Based on the analysis of the Primary Ripples (technological consequences) and Secondary Ripples (human reactions) of {technology}, generate five innovative business or product concepts.

    For each concept, explicitly state:

    1.  **The Concept:** A clear, one-sentence description of the business or product.
    2.  **The Primary Ripple Leveraged:** Which specific technological capability or efficiency does this concept use?
    3.  **The Secondary Ripple Addressed:** Which specific human need, fear, or desire does this concept serve?

    Present the results as a list of bullet points, with each point starting with a bolded title (e.g., **Concept 1:**).
    """

    # Call the LLM for each prompt
    try:
        response1 = model.generate_content(prompt1_primary_ripples)
        primary_ripples_points = parse_llm_response(response1.text)

        response2 = model.generate_content(prompt2_secondary_ripples)
        secondary_ripples_points = parse_llm_response(response2.text)

        response3 = model.generate_content(prompt3_synthesis)
        synthesis_points = parse_llm_response(response3.text)

    except genai.APIError as e:
        print(f"LLM API Error: {e}")
        primary_ripples_points = ["Error: Could not retrieve primary ripples. Please try again later."]
        secondary_ripples_points = ["Error: Could not retrieve secondary ripples. Please try again later."]
        synthesis_points = ["Error: Could not retrieve synthesis. Please try again later."]
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

