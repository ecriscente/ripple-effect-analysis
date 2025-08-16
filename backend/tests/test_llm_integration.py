import pytest
import os
from unittest.mock import patch, MagicMock

# Mock the environment variable before importing the module
with patch.dict(os.environ, {'GEMINI_API_KEY': 'test-api-key'}):
    from backend.llm_integration import get_analysis, model # Import model

@pytest.fixture
def mock_gemini_response():
    """Fixture to create a mock Gemini response object."""
    mock_response = MagicMock()
    mock_response.text = "- Mocked Point 1\n- Mocked Point 2"
    return mock_response

# Patch the model directly
@patch.object(model, 'generate_content')
def test_get_analysis_success(mock_generate_content, mock_gemini_response):
    """Test the get_analysis function for a successful API call."""
    # Arrange
    mock_generate_content.return_value = mock_gemini_response

    # Act
    technology = "Test Tech"
    result = get_analysis(technology)

    # Assert
    assert "primary_ripples" in result
    assert result["primary_ripples"]["title"] == f"Primary Ripples for {technology}"
    assert result["primary_ripples"]["points"] == ["Mocked Point 1", "Mocked Point 2"]
    assert mock_generate_content.call_count == 3

@patch.object(model, 'generate_content')
def test_get_analysis_api_error(mock_generate_content):
    """Test the get_analysis function for an API error scenario."""
    # Arrange
    mock_generate_content.side_effect = Exception("API is down")

    # Act
    technology = "Error Tech"
    result = get_analysis(technology)

    # Assert
    error_message = "Error: An unexpected error occurred. Please try again later."
    assert result["primary_ripples"]["points"] == [error_message]
    assert result["secondary_ripples"]["points"] == [error_message]
    assert result["synthesis"]["points"] == [error_message]