import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { marked } from 'marked';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import AnalysisDetail from './AnalysisDetail';
import AnalysisForm from './AnalysisForm';

const Home = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <div className="container">
      <header>
        <h1>The Zeitgeist Engine</h1>
        <p className="subtitle">A Framework for Predicting Humanity's Next Necessities</p>
      </header>

      {isAuthenticated ? (
        <AnalysisForm />
      ) : (
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked(`
# The Ripple Effect of AI: A Framework for Predicting Humanity's Next Necessities

*A collaboration between a human and a Gemini consultant.*

## Introduction: Beyond the Singularity

The conversation around Artificial Intelligence is often dominated by a single, awe-inspiring concept: the singularity. While the prospect of superhuman intelligence is profound, focusing solely on this distant horizon can blind us to the immediate, tangible needs emerging in our world today. The real question for innovators, entrepreneurs, and problem-solvers is not *if* the singularity is coming, but how we can systematically identify and address the human necessities that arise from the powerful technological waves already reaching our shores.

This article introduces the **"Ripple Effect Analysis,"** a framework for understanding and predicting the business and societal opportunities created by transformative technologies like AI. Developed through a unique collaboration between a human and a Gemini large language model, this framework moves beyond technological determinism to offer a more holistic view—one that accounts for not just the technology itself, but our complex human reaction to it.

## The Ripple Effect Framework

Imagine dropping a stone into a still pond. The impact creates a series of concentric ripples that spread outwards. The development of a powerful general-purpose technology like AI is that stone. To understand its full impact, we must analyze two distinct types of ripples:

**1. The Primary Ripples: Direct Technological Consequences**

These are the immediate, functional needs created *by the technology itself*. They are the direct consequences of AI's new capabilities. For businesses, these are often the most obvious and immediate opportunities. Our analysis identified four key primary ripples from the current wave of Generative AI:

*   **Hyper-Personalization:** The ability to tailor experiences, products, and services to an individual's specific needs and preferences at an unprecedented scale.
*   **Content & Administrative Automation:** The capacity to automate the creation of a wide range of content (from marketing copy to internal communications) and to handle routine administrative tasks, freeing up human capital.
*   **AI-Powered Customer Operations:** The deployment of sophisticated AI assistants to manage customer service inquiries, providing 24/7 support and enabling human agents to focus on more complex, high-value interactions.
*   **Accelerated Software Development:** The use of AI to assist engineers in writing, debugging, and testing code, dramatically increasing the speed and efficiency of software creation.

These primary ripples represent a paradigm shift in efficiency and capability. However, they are only half of the story. To find the most profound and uniquely human opportunities, we must look further out.

**2. The Secondary Ripples: The Human & Societal Reaction**

These are the waves of change created by our collective human reaction *to* the primary ripples. They are not about the technology itself, but about how it makes us feel, how it changes our relationships, and what we value in its presence. These secondary ripples are often more subtle but point to deeper, more enduring needs:

*   **The Need for Economic Security & Continuous Reskilling:** The efficiency of AI-driven automation creates a legitimate anxiety about job displacement. This gives rise to a massive, continuous need for accessible and effective platforms for reskilling and upskilling, with a particular focus on cultivating abilities that AI cannot replicate.
*   **The Craving for Authentic Social Connection:** As interactions with AI become more common, there is a growing concern about "empathy atrophy"—a potential decline in our ability to engage with the complexities of human emotions. This fuels a powerful demand for services, platforms, and experiences that foster genuine, real-world human connection and build strong communities.
*   **The Premium on "Human" Skills:** In a world where AI can generate content and analyze data, the skills that become most valuable are those that are intrinsically human. Critical thinking, deep creativity, emotional intelligence, and complex problem-solving are no longer soft skills, but essential "power skills." This creates a market for new forms of education and professional development focused on honing these abilities.
*   **The Search for Purpose and Meaning:** When AI can handle the "how," humans are freed—and compelled—to focus on the "why." This leads to a profound search for purpose, both in our work and in our personal lives. Businesses that are mission-driven, that help individuals align their work with their values, and that offer products that provide genuine fulfillment will have a significant advantage.
*   **The Demand for Privacy and Trust:** The data-intensive nature of AI systems naturally creates a need for robust privacy-enhancing technologies and services. As users become more aware of their digital footprint, they will demand tools that give them control over their data and build trust in the systems they interact with.

## Conclusion: Finding Opportunity at the Intersection

The true power of the Ripple Effect Analysis lies not in viewing these two sets of ripples in isolation, but in understanding their intersection. The most innovative and sustainable business models for our emerging future will be those that leverage the capabilities of the Primary Ripples to serve the deep human needs of the Secondary Ripples.

Consider these examples:

*   **AI-Powered, Human-Centered Reskilling:** Imagine a platform that uses **hyper-personalization (Primary)** to create unique learning journeys for individuals, helping them develop the **"human" skills (Secondary)** of creativity and critical thinking that are most resilient to automation.
*   **Community-Building as a Service:** A business could use **AI-powered customer operations (Primary)** to manage the logistics of events and communications for niche communities, freeing up organizers to foster the **authentic social connection (Secondary)** that members crave.
*   **Purpose-Driven Career Platforms:** A next-generation career coaching service could use **AI-driven content automation (Primary)** to analyze market trends and an individual's values, helping them find a career path that provides a deep **search for purpose (Secondary)**.

> In an environment of accelerating change, the specific products of today can become obsolete tomorrow. The most durable and valuable asset is the process used to generate those ideas. A framework for prediction is more resilient than any single prediction.
>
> By focusing on refining the "Ripple Effect Analysis," we are essentially building a machine that builds the machine. We're creating a repeatable methodology for innovation.

The message is clear: the next great necessity for humanity will not be a purely technological one. It will be found in the thoughtful application of powerful tools to serve our most fundamental human needs. The framework of Primary and Secondary Ripples is a map that can help us navigate the turbulent waters of technological change and find the shores of genuine, human-centered opportunity.

The question for every innovator is no longer just "What can this technology do?" but "What deep human need can this technology help us meet?" By starting with the human reaction, we can build businesses that are not only successful, but essential.
`)}} />
      )}
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // Convert token presence to boolean
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    checkAuthStatus(); // Update auth status immediately after logout
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="container">
        <nav>
          <Link to="/">Home</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
          <Route path="/login" element={<Login onLogin={checkAuthStatus} />} />
          <Route path="/register" element={<Register onRegister={checkAuthStatus} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;