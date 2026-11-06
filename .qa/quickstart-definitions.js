// Verified Developer Quick Start definitions for DevSpire Nexus
module.exports = {
  "developer_resource:langchain": {
    "available": true,
    "verification_status": "verified",
    "package_name": "langchain",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install langchain langchain-openai langchain-core",
        "source_url": "https://python.langchain.com/docs/introduction/",
        "verified": true
      },
      {
        "pm": "uv",
        "label": "uv",
        "command": "uv add langchain langchain-openai langchain-core",
        "source_url": "https://python.langchain.com/docs/introduction/",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install langchain @langchain/openai @langchain/core",
        "source_url": "https://js.langchain.com/docs/introduction/",
        "verified": true
      },
      {
        "pm": "pnpm",
        "label": "pnpm",
        "command": "pnpm add langchain @langchain/openai @langchain/core",
        "source_url": "https://js.langchain.com/docs/introduction/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "LangChain Documentation",
      "url": "https://python.langchain.com/",
      "domain": "python.langchain.com",
      "verified": true
    },
    "github": {
      "owner": "langchain-ai",
      "repo": "langchain",
      "url": "https://github.com/langchain-ai/langchain",
      "license": "MIT",
      "default_branch": "master",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://python.langchain.com/"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://js.langchain.com/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Prompt Template + Chat Model Pipe",
        "prerequisites": [
          "Python 3.9+",
          "pip install langchain langchain-openai"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import os\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\n\nllm = ChatOpenAI(model=\"gpt-4o-mini\", api_key=os.environ[\"OPENAI_API_KEY\"])\nprompt = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a concise AI assistant.\"),\n    (\"user\", \"{topic}\")\n])\n\nchain = prompt | llm\nresponse = chain.invoke({\"topic\": \"Explain RAG in one sentence.\"})\nprint(response.content)",
        "expected_output": "RAG enhances LLM responses by retrieving relevant information from an external knowledge base before generating answers.",
        "documentation_url": "https://python.langchain.com/docs/tutorials/llm_chain/",
        "verified": true
      },
      {
        "language": "javascript",
        "label": "TypeScript / JavaScript",
        "title": "Prompt Pipe with ChatOpenAI",
        "prerequisites": [
          "Node.js 18+",
          "npm install @langchain/openai @langchain/core"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import { ChatOpenAI } from \"@langchain/openai\";\nimport { ChatPromptTemplate } from \"@langchain/core/prompts\";\n\nconst model = new ChatOpenAI({\n  model: \"gpt-4o-mini\",\n  apiKey: process.env.OPENAI_API_KEY,\n});\n\nconst prompt = ChatPromptTemplate.fromMessages([\n  [\"system\", \"You are a concise AI assistant.\"],\n  [\"user\", \"{topic}\"]\n]);\n\nconst chain = prompt.pipe(model);\nconst response = await chain.invoke({ topic: \"Explain RAG in one sentence.\" });\nconsole.log(response.content);",
        "expected_output": null,
        "documentation_url": "https://js.langchain.com/docs/introduction/",
        "verified": true
      }
    ]
  },
  "developer_resource:llamaindex": {
    "available": true,
    "verification_status": "verified",
    "package_name": "llama-index",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install llama-index llama-index-llms-openai",
        "source_url": "https://docs.llamaindex.ai/en/stable/",
        "verified": true
      },
      {
        "pm": "uv",
        "label": "uv",
        "command": "uv add llama-index llama-index-llms-openai",
        "source_url": "https://docs.llamaindex.ai/en/stable/",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install llamaindex",
        "source_url": "https://ts.llamaindex.ai/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "LlamaIndex Documentation",
      "url": "https://docs.llamaindex.ai/",
      "domain": "docs.llamaindex.ai",
      "verified": true
    },
    "github": {
      "owner": "run-llama",
      "repo": "llama_index",
      "url": "https://github.com/run-llama/llama_index",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.llamaindex.ai/"
      },
      {
        "language": "TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://ts.llamaindex.ai/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "In-Memory VectorStoreIndex Document Query",
        "prerequisites": [
          "Python 3.9+",
          "pip install llama-index"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import os\nfrom llama_index.core import Document, VectorStoreIndex\n\ndocs = [\n    Document(text=\"DevSpire Nexus is an AI Intelligence Directory indexing tools, models, and developer resources.\")\n]\nindex = VectorStoreIndex.from_documents(docs)\nquery_engine = index.as_query_engine()\nresponse = query_engine.query(\"What does DevSpire Nexus index?\")\nprint(str(response))",
        "expected_output": "DevSpire Nexus indexes AI tools, AI models, and developer resources.",
        "documentation_url": "https://docs.llamaindex.ai/en/stable/getting_started/starter_example/",
        "verified": true
      }
    ]
  },
  "developer_resource:crewai": {
    "available": true,
    "verification_status": "verified",
    "package_name": "crewai",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install crewai crewai-tools",
        "source_url": "https://docs.crewai.com/",
        "verified": true
      },
      {
        "pm": "uv",
        "label": "uv",
        "command": "uv add crewai crewai-tools",
        "source_url": "https://docs.crewai.com/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "CrewAI Documentation",
      "url": "https://docs.crewai.com/",
      "domain": "docs.crewai.com",
      "verified": true
    },
    "github": {
      "owner": "crewAIInc",
      "repo": "crewAI",
      "url": "https://github.com/crewAIInc/crewAI",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.crewai.com/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Define an Agent, Task, and Crew Execution",
        "prerequisites": [
          "Python 3.10+",
          "pip install crewai"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import os\nfrom crewai import Agent, Task, Crew, Process\n\nresearcher = Agent(\n    role=\"Tech Analyst\",\n    goal=\"Summarize latest developer trends\",\n    backstory=\"You are an expert technology analyst who provides brief, insightful summaries.\",\n    verbose=True\n)\n\ntask = Task(\n    description=\"Summarize why developers adopt local LLM runtimes like Ollama.\",\n    expected_output=\"A 2-bullet summary.\",\n    agent=researcher\n)\n\ncrew = Crew(\n    agents=[researcher],\n    tasks=[task],\n    process=Process.sequential\n)\nresult = crew.kickoff()\nprint(result)",
        "expected_output": "- Data privacy and zero egress costs\n- Offline reliability and fast prototyping",
        "documentation_url": "https://docs.crewai.com/how-to/Creating-a-Crew-and-kick-it-off/",
        "verified": true
      }
    ]
  },
  "developer_resource:dspy": {
    "available": true,
    "verification_status": "verified",
    "package_name": "dspy-ai",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install dspy-ai",
        "source_url": "https://dspy-docs.vercel.app/",
        "verified": true
      },
      {
        "pm": "uv",
        "label": "uv",
        "command": "uv add dspy-ai",
        "source_url": "https://dspy-docs.vercel.app/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "DSPy Documentation",
      "url": "https://dspy.ai/",
      "domain": "dspy.ai",
      "verified": true
    },
    "github": {
      "owner": "stanfordnlp",
      "repo": "dspy",
      "url": "https://github.com/stanfordnlp/dspy",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://dspy.ai/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Declare Signature and Predict with LM",
        "prerequisites": [
          "Python 3.9+",
          "pip install dspy-ai"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import os\nimport dspy\n\nlm = dspy.LM(\"openai/gpt-4o-mini\", api_key=os.environ[\"OPENAI_API_KEY\"])\ndspy.configure(lm=lm)\n\nclass QA(dspy.Signature):\n    \"\"\"Answer questions with short, precise factual responses.\"\"\"\n    question: str = dspy.InputField()\n    answer: str = dspy.OutputField()\n\npredict = dspy.Predict(QA)\nresult = predict(question=\"What is the capital of France?\")\nprint(result.answer)",
        "expected_output": "Paris",
        "documentation_url": "https://dspy.ai/learn/programming/signatures/",
        "verified": true
      }
    ]
  },
  "developer_resource:litellm": {
    "available": true,
    "verification_status": "verified",
    "package_name": "litellm",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install litellm",
        "source_url": "https://docs.litellm.ai/docs/",
        "verified": true
      },
      {
        "pm": "pipx",
        "label": "pipx (Proxy CLI)",
        "command": "pipx install 'litellm[proxy]'",
        "source_url": "https://docs.litellm.ai/docs/proxy/quick_start",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker (Proxy)",
        "command": "docker run -p 4000:4000 ghcr.io/berriai/litellm:main-latest",
        "source_url": "https://docs.litellm.ai/docs/proxy/docker_quick_start",
        "verified": true
      }
    ],
    "documentation": {
      "title": "LiteLLM Documentation",
      "url": "https://docs.litellm.ai/",
      "domain": "docs.litellm.ai",
      "verified": true
    },
    "github": {
      "owner": "BerriAI",
      "repo": "litellm",
      "url": "https://github.com/BerriAI/litellm",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.litellm.ai/"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://docs.litellm.ai/docs/proxy/quick_start"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Call 100+ LLMs in standard OpenAI format",
        "prerequisites": [
          "Python 3.9+",
          "pip install litellm"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import os\nfrom litellm import completion\n\nresponse = completion(\n    model=\"gpt-4o-mini\",\n    messages=[{\"role\": \"user\", \"content\": \"Hello, world!\"}]\n)\nprint(response.choices[0].message.content)",
        "expected_output": "Hello! How can I help you today?",
        "documentation_url": "https://docs.litellm.ai/docs/",
        "verified": true
      }
    ]
  },
  "developer_resource:instructor": {
    "available": true,
    "verification_status": "verified",
    "package_name": "instructor",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install instructor openai pydantic",
        "source_url": "https://python.useinstructor.com/",
        "verified": true
      },
      {
        "pm": "uv",
        "label": "uv",
        "command": "uv add instructor openai pydantic",
        "source_url": "https://python.useinstructor.com/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Instructor Documentation",
      "url": "https://python.useinstructor.com/",
      "domain": "python.useinstructor.com",
      "verified": true
    },
    "github": {
      "owner": "instructor-ai",
      "repo": "instructor",
      "url": "https://github.com/instructor-ai/instructor",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://python.useinstructor.com/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Extract Pydantic model directly from LLM",
        "prerequisites": [
          "Python 3.9+",
          "pip install instructor openai pydantic"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import instructor\nfrom openai import OpenAI\nfrom pydantic import BaseModel\n\nclient = instructor.from_openai(OpenAI())\n\nclass UserDetail(BaseModel):\n    name: str\n    age: int\n    city: str\n\nuser = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    response_model=UserDetail,\n    messages=[{\"role\": \"user\", \"content\": \"Extract: Alex is 28 years old and lives in Berlin\"}]\n)\nprint(user.name, user.age, user.city)",
        "expected_output": "Alex 28 Berlin",
        "documentation_url": "https://python.useinstructor.com/why/",
        "verified": true
      }
    ]
  },
  "developer_resource:ollama": {
    "available": true,
    "verification_status": "verified",
    "package_name": "ollama",
    "installation": [
      {
        "pm": "curl",
        "label": "Linux / macOS (script)",
        "command": "curl -fsSL https://ollama.com/install.sh | sh",
        "source_url": "https://ollama.com/download",
        "verified": true
      },
      {
        "pm": "brew",
        "label": "Homebrew",
        "command": "brew install ollama",
        "source_url": "https://ollama.com/download",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker",
        "command": "docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama",
        "source_url": "https://hub.docker.com/r/ollama/ollama",
        "verified": true
      },
      {
        "pm": "pip",
        "label": "Python Client",
        "command": "pip install ollama",
        "source_url": "https://github.com/ollama/ollama-python",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "JS / TS Client",
        "command": "npm install ollama",
        "source_url": "https://github.com/ollama/ollama-js",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Ollama Official Docs",
      "url": "https://ollama.com/",
      "domain": "ollama.com",
      "verified": true
    },
    "github": {
      "owner": "ollama",
      "repo": "ollama",
      "url": "https://github.com/ollama/ollama",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "CLI",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/ollama/ollama"
      },
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/ollama/ollama-python"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/ollama/ollama-js"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://github.com/ollama/ollama/blob/main/docs/api.md"
      }
    ],
    "examples": [
      {
        "language": "bash",
        "label": "CLI Command",
        "title": "Pull and run Llama 3.2 locally",
        "prerequisites": [
          "Ollama service running on localhost:11434"
        ],
        "env_vars": [],
        "code": "# Run a prompt directly from the shell\nollama run llama3.2 \"Why is the sky blue? Answer in one sentence.\"",
        "expected_output": "The sky appears blue because molecules in Earth's atmosphere scatter shorter blue wavelengths of sunlight more than other colors.",
        "documentation_url": "https://github.com/ollama/ollama/blob/main/docs/modelfile.md",
        "verified": true
      },
      {
        "language": "python",
        "label": "Python SDK",
        "title": "Chat with a locally running model",
        "prerequisites": [
          "pip install ollama",
          "ollama pull llama3.2"
        ],
        "env_vars": [],
        "code": "import ollama\n\nresponse = ollama.chat(\n    model=\"llama3.2\",\n    messages=[{\"role\": \"user\", \"content\": \"What is 15 * 6?\"}]\n)\nprint(response[\"message\"][\"content\"])",
        "expected_output": "15 * 6 is 90.",
        "documentation_url": "https://github.com/ollama/ollama-python",
        "verified": true
      }
    ]
  },
  "developer_resource:vllm": {
    "available": true,
    "verification_status": "verified",
    "package_name": "vllm",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (CUDA)",
        "command": "pip install vllm",
        "source_url": "https://docs.vllm.ai/en/latest/getting_started/installation.html",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker (NVIDIA GPU)",
        "command": "docker run --gpus all -v ~/.cache/huggingface:/root/.cache/huggingface -p 8000:8000 --ipc=host vllm/vllm-openai:latest --model meta-llama/Llama-3.2-1B-Instruct",
        "source_url": "https://docs.vllm.ai/en/latest/serving/deploying_with_docker.html",
        "verified": true
      }
    ],
    "documentation": {
      "title": "vLLM Documentation",
      "url": "https://docs.vllm.ai/",
      "domain": "docs.vllm.ai",
      "verified": true
    },
    "github": {
      "owner": "vllm-project",
      "repo": "vllm",
      "url": "https://github.com/vllm-project/vllm",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.vllm.ai/"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python (Offline Batch)",
        "title": "Fast batched text generation",
        "prerequisites": [
          "Python 3.9+",
          "CUDA-compatible GPU",
          "pip install vllm"
        ],
        "env_vars": [],
        "code": "from vllm import LLM, SamplingParams\n\nprompts = [\n    \"Hello, my name is\",\n    \"The capital of France is\"\n]\nsampling_params = SamplingParams(temperature=0.7, top_p=0.95, max_tokens=16)\n\nllm = LLM(model=\"Qwen/Qwen2.5-0.5B-Instruct\")\noutputs = llm.generate(prompts, sampling_params)\n\nfor output in outputs:\n    prompt = output.prompt\n    generated_text = output.outputs[0].text\n    print(f\"{prompt!r} -> {generated_text!r}\")",
        "expected_output": null,
        "documentation_url": "https://docs.vllm.ai/en/latest/getting_started/quickstart.html",
        "verified": true
      }
    ]
  },
  "developer_resource:chroma": {
    "available": true,
    "verification_status": "verified",
    "package_name": "chromadb",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install chromadb",
        "source_url": "https://docs.trychroma.com/",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install chromadb",
        "source_url": "https://docs.trychroma.com/docs/js/overview",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker",
        "command": "docker run -p 8000:8000 chromadb/chroma",
        "source_url": "https://docs.trychroma.com/production/administration/docker",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Chroma Documentation",
      "url": "https://docs.trychroma.com/",
      "domain": "docs.trychroma.com",
      "verified": true
    },
    "github": {
      "owner": "chroma-core",
      "repo": "chroma",
      "url": "https://github.com/chroma-core/chroma",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.trychroma.com/docs/overview/getting-started"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.trychroma.com/docs/js/overview"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Create collection, add documents, and query similarity",
        "prerequisites": [
          "Python 3.9+",
          "pip install chromadb"
        ],
        "env_vars": [],
        "code": "import chromadb\n\n# Ephemeral in-memory client\nclient = chromadb.Client()\ncollection = client.create_collection(\"docs\")\n\ncollection.add(\n    documents=[\"DevSpire Nexus catalog\", \"Vector database guide\", \"Kubernetes cluster setup\"],\n    ids=[\"id1\", \"id2\", \"id3\"]\n)\n\nresults = collection.query(\n    query_texts=[\"AI directory indexing\"],\n    n_results=1\n)\nprint(results[\"documents\"][0])",
        "expected_output": "['DevSpire Nexus catalog']",
        "documentation_url": "https://docs.trychroma.com/docs/overview/getting-started",
        "verified": true
      }
    ]
  },
  "developer_resource:qdrant": {
    "available": true,
    "verification_status": "verified",
    "package_name": "qdrant-client",
    "installation": [
      {
        "pm": "docker",
        "label": "Docker Server",
        "command": "docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage:z qdrant/qdrant",
        "source_url": "https://qdrant.tech/documentation/quick-start/",
        "verified": true
      },
      {
        "pm": "pip",
        "label": "Python Client",
        "command": "pip install qdrant-client",
        "source_url": "https://github.com/qdrant/qdrant-client",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "JavaScript Client",
        "command": "npm install @qdrant/js-client-rest",
        "source_url": "https://github.com/qdrant/js-client-rest",
        "verified": true
      },
      {
        "pm": "cargo",
        "label": "Rust",
        "command": "cargo add qdrant-client",
        "source_url": "https://github.com/qdrant/rust-client",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Qdrant Documentation",
      "url": "https://qdrant.tech/documentation/",
      "domain": "qdrant.tech",
      "verified": true
    },
    "github": {
      "owner": "qdrant",
      "repo": "qdrant",
      "url": "https://github.com/qdrant/qdrant",
      "license": "Apache 2.0",
      "default_branch": "master",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://qdrant.tech/documentation/quick-start/"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/qdrant/js-client-rest"
      },
      {
        "language": "Rust",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/qdrant/rust-client"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://qdrant.github.io/qdrant/redoc/index.html"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python (In-Memory)",
        "title": "Create in-memory collection and query point",
        "prerequisites": [
          "Python 3.9+",
          "pip install qdrant-client"
        ],
        "env_vars": [],
        "code": "from qdrant_client import QdrantClient\nfrom qdrant_client.models import Distance, VectorParams, PointStruct\n\n# Local in-memory mode without external server\nclient = QdrantClient(\":memory:\")\nclient.create_collection(\n    collection_name=\"demo\",\n    vectors_config=VectorParams(size=4, distance=Distance.DOT)\n)\n\nclient.upsert(\n    collection_name=\"demo\",\n    points=[\n        PointStruct(id=1, vector=[0.05, 0.61, 0.76, 0.74], payload={\"city\": \"Berlin\"}),\n        PointStruct(id=2, vector=[0.19, 0.81, 0.75, 0.11], payload={\"city\": \"London\"})\n    ]\n)\n\nhits = client.query_points(\n    collection_name=\"demo\",\n    query=[0.2, 0.1, 0.9, 0.7],\n    limit=1\n)\nprint(\"Closest point:\", hits.points[0].payload)",
        "expected_output": "Closest point: {'city': 'Berlin'}",
        "documentation_url": "https://qdrant.tech/documentation/quick-start/",
        "verified": true
      }
    ]
  },
  "developer_resource:lancedb": {
    "available": true,
    "verification_status": "verified",
    "package_name": "lancedb",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install lancedb",
        "source_url": "https://lancedb.github.io/lancedb/",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install @lancedb/lancedb",
        "source_url": "https://lancedb.github.io/lancedb/javascript/",
        "verified": true
      },
      {
        "pm": "cargo",
        "label": "Rust",
        "command": "cargo add lancedb",
        "source_url": "https://github.com/lancedb/lancedb",
        "verified": true
      }
    ],
    "documentation": {
      "title": "LanceDB Documentation",
      "url": "https://lancedb.github.io/lancedb/",
      "domain": "lancedb.github.io",
      "verified": true
    },
    "github": {
      "owner": "lancedb",
      "repo": "lancedb",
      "url": "https://github.com/lancedb/lancedb",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://lancedb.github.io/lancedb/python/python/"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://lancedb.github.io/lancedb/javascript/"
      },
      {
        "language": "Rust",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.rs/lancedb"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Create embedded dataset and search vector similarity",
        "prerequisites": [
          "Python 3.9+",
          "pip install lancedb"
        ],
        "env_vars": [],
        "code": "import lancedb\n\n# Embedded local database on disk\ndb = lancedb.connect(\"/tmp/lancedb_demo\")\ndata = [\n    {\"vector\": [1.1, 1.2], \"item\": \"apple\", \"price\": 10.0},\n    {\"vector\": [1.8, 1.9], \"item\": \"banana\", \"price\": 5.0}\n]\ntbl = db.create_table(\"fruits\", data=data, mode=\"overwrite\")\nresult = tbl.search([1.0, 1.0]).limit(1).to_list()\nprint(\"Nearest item:\", result[0][\"item\"])",
        "expected_output": "Nearest item: apple",
        "documentation_url": "https://lancedb.github.io/lancedb/basic/",
        "verified": true
      }
    ]
  },
  "developer_resource:langfuse": {
    "available": true,
    "verification_status": "verified",
    "package_name": "langfuse",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install langfuse",
        "source_url": "https://langfuse.com/docs",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install langfuse",
        "source_url": "https://langfuse.com/docs/sdk/typescript/guide",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Self-Host Docker",
        "command": "docker run -p 3000:3000 ghcr.io/langfuse/langfuse:latest",
        "source_url": "https://langfuse.com/docs/deployment/self-host",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Langfuse Documentation",
      "url": "https://langfuse.com/docs",
      "domain": "langfuse.com",
      "verified": true
    },
    "github": {
      "owner": "langfuse",
      "repo": "langfuse",
      "url": "https://github.com/langfuse/langfuse",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://langfuse.com/docs/sdk/python"
      },
      {
        "language": "TypeScript / JavaScript",
        "support_type": "official_sdk",
        "documentation_url": "https://langfuse.com/docs/sdk/typescript"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Trace an LLM execution with observe decorator",
        "prerequisites": [
          "pip install langfuse openai",
          "Langfuse API keys configured"
        ],
        "env_vars": [
          "LANGFUSE_SECRET_KEY",
          "LANGFUSE_PUBLIC_KEY",
          "LANGFUSE_HOST"
        ],
        "code": "import os\nfrom langfuse.openai import openai\n\n# Drop-in wrapper automatically traces tokens, latency, and costs\nresponse = openai.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    messages=[{\"role\": \"user\", \"content\": \"Tell me a developer joke.\"}],\n    name=\"joke-generator\"\n)\nprint(response.choices[0].message.content)",
        "expected_output": null,
        "documentation_url": "https://langfuse.com/docs/integrations/openai/python/get-started",
        "verified": true
      }
    ]
  },
  "developer_resource:arize-phoenix": {
    "available": true,
    "verification_status": "verified",
    "package_name": "arize-phoenix",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install arize-phoenix openinference-instrumentation-openai",
        "source_url": "https://docs.arize.com/phoenix/",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker",
        "command": "docker run -p 6006:6006 arizephoenix/phoenix:latest",
        "source_url": "https://docs.arize.com/phoenix/deployment/docker",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Arize Phoenix Documentation",
      "url": "https://docs.arize.com/phoenix/",
      "domain": "docs.arize.com",
      "verified": true
    },
    "github": {
      "owner": "Arize-ai",
      "repo": "phoenix",
      "url": "https://github.com/Arize-ai/phoenix",
      "license": "ELv2",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.arize.com/phoenix/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Launch local observability UI and instrument calls",
        "prerequisites": [
          "Python 3.9+",
          "pip install arize-phoenix"
        ],
        "env_vars": [],
        "code": "import phoenix as px\n\n# Launch local Phoenix dashboard UI on http://localhost:6006\nsession = px.launch_app()\nprint(f\"Phoenix UI running at: {session.url}\")",
        "expected_output": "Phoenix UI running at: http://localhost:6006",
        "documentation_url": "https://docs.arize.com/phoenix/quickstart",
        "verified": true
      }
    ]
  },
  "developer_resource:openrouter": {
    "available": true,
    "verification_status": "verified",
    "package_name": "openai (compatible)",
    "installation": [
      {
        "pm": "pip",
        "label": "Python (OpenAI SDK)",
        "command": "pip install openai",
        "source_url": "https://openrouter.ai/docs#quick-start",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "JavaScript / TypeScript",
        "command": "npm install openai",
        "source_url": "https://openrouter.ai/docs#quick-start",
        "verified": true
      },
      {
        "pm": "curl",
        "label": "REST API (cURL)",
        "command": "curl https://openrouter.ai/api/v1/chat/completions -H 'Authorization: Bearer $OPENROUTER_API_KEY'",
        "source_url": "https://openrouter.ai/docs",
        "verified": true
      }
    ],
    "documentation": {
      "title": "OpenRouter Documentation",
      "url": "https://openrouter.ai/docs",
      "domain": "openrouter.ai",
      "verified": true
    },
    "github": {
      "owner": "OpenRouterTeam",
      "repo": "openrouter-runner",
      "url": "https://github.com/OpenRouterTeam",
      "license": "Proprietary / Managed API",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://openrouter.ai/docs"
      },
      {
        "language": "Python",
        "support_type": "client_library",
        "documentation_url": "https://openrouter.ai/docs#quick-start"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "client_library",
        "documentation_url": "https://openrouter.ai/docs#quick-start"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Call frontier models through OpenRouter",
        "prerequisites": [
          "pip install openai"
        ],
        "env_vars": [
          "OPENROUTER_API_KEY"
        ],
        "code": "import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    base_url=\"https://openrouter.ai/api/v1\",\n    api_key=os.environ[\"OPENROUTER_API_KEY\"]\n)\n\ncompletion = client.chat.completions.create(\n    model=\"deepseek/deepseek-r1\",\n    messages=[{\"role\": \"user\", \"content\": \"What is 2 + 2?\"}]\n)\nprint(completion.choices[0].message.content)",
        "expected_output": "4",
        "documentation_url": "https://openrouter.ai/docs#quick-start",
        "verified": true
      }
    ]
  },
  "developer_resource:groq-cloud": {
    "available": true,
    "verification_status": "verified",
    "package_name": "groq",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install groq",
        "source_url": "https://console.groq.com/docs/quickstart",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install groq-sdk",
        "source_url": "https://console.groq.com/docs/quickstart",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Groq Documentation",
      "url": "https://console.groq.com/docs",
      "domain": "console.groq.com",
      "verified": true
    },
    "github": {
      "owner": "groq",
      "repo": "groq-python",
      "url": "https://github.com/groq/groq-python",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/groq/groq-python"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/groq/groq-typescript"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://console.groq.com/docs/api-reference"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Ultra-fast inference with Llama 3.3 on Groq LPU",
        "prerequisites": [
          "Python 3.9+",
          "pip install groq"
        ],
        "env_vars": [
          "GROQ_API_KEY"
        ],
        "code": "import os\nfrom groq import Groq\n\nclient = Groq(api_key=os.environ[\"GROQ_API_KEY\"])\nchat_completion = client.chat.completions.create(\n    messages=[{\"role\": \"user\", \"content\": \"Explain quantum computing in one sentence.\"}],\n    model=\"llama-3.3-70b-versatile\"\n)\nprint(chat_completion.choices[0].message.content)",
        "expected_output": null,
        "documentation_url": "https://console.groq.com/docs/quickstart",
        "verified": true
      }
    ]
  },
  "developer_resource:unsloth": {
    "available": true,
    "verification_status": "verified",
    "package_name": "unsloth",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (CUDA)",
        "command": "pip install unsloth",
        "source_url": "https://docs.unsloth.ai/get-started/installation",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Unsloth Documentation",
      "url": "https://docs.unsloth.ai/",
      "domain": "docs.unsloth.ai",
      "verified": true
    },
    "github": {
      "owner": "unslothai",
      "repo": "unsloth",
      "url": "https://github.com/unslothai/unsloth",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.unsloth.ai/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Load 4-bit quantized model for 2x faster fine-tuning",
        "prerequisites": [
          "CUDA GPU",
          "pip install unsloth"
        ],
        "env_vars": [],
        "code": "from unsloth import FastLanguageModel\nimport torch\n\nmax_seq_length = 2048\nmodel, tokenizer = FastLanguageModel.from_pretrained(\n    model_name=\"unsloth/Llama-3.2-1B-Instruct\",\n    max_seq_length=max_seq_length,\n    load_in_4bit=True\n)\n\n# Ready for LoRA fine-tuning\nmodel = FastLanguageModel.get_peft_model(\n    model,\n    r=16,\n    target_modules=[\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\"],\n    lora_alpha=16,\n    lora_dropout=0\n)\nprint(\"Unsloth model initialized with LoRA adapters.\")",
        "expected_output": "Unsloth model initialized with LoRA adapters.",
        "documentation_url": "https://docs.unsloth.ai/tutorials/llama-3.2-how-to-fine-tune",
        "verified": true
      }
    ]
  },
  "developer_resource:deepeval": {
    "available": true,
    "verification_status": "verified",
    "package_name": "deepeval",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install deepeval",
        "source_url": "https://docs.confident-ai.com/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "DeepEval Documentation",
      "url": "https://docs.confident-ai.com/",
      "domain": "docs.confident-ai.com",
      "verified": true
    },
    "github": {
      "owner": "confident-ai",
      "repo": "deepeval",
      "url": "https://github.com/confident-ai/deepeval",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.confident-ai.com/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Unit test LLM outputs against Hallucination metric",
        "prerequisites": [
          "Python 3.9+",
          "pip install deepeval"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "from deepeval.test_case import LLMTestCase\nfrom deepeval.metrics import HallucinationMetric\n\ntest_case = LLMTestCase(\n    input=\"What is the capital of France?\",\n    actual_output=\"Paris is the capital of France.\",\n    context=[\"Paris is the capital and most populous city of France.\"]\n)\n\nmetric = HallucinationMetric(threshold=0.5)\nmetric.measure(test_case)\nprint(\"Score:\", metric.score, \"Passed:\", metric.is_successful())",
        "expected_output": "Score: 0.0 Passed: True",
        "documentation_url": "https://docs.confident-ai.com/docs/metrics-hallucination",
        "verified": true
      }
    ]
  },
  "developer_resource:ragas": {
    "available": true,
    "verification_status": "verified",
    "package_name": "ragas",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install ragas datasets",
        "source_url": "https://docs.ragas.io/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Ragas Documentation",
      "url": "https://docs.ragas.io/",
      "domain": "docs.ragas.io",
      "verified": true
    },
    "github": {
      "owner": "explodinggradients",
      "repo": "ragas",
      "url": "https://github.com/explodinggradients/ragas",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.ragas.io/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Score answer relevance and faithfulness in RAG",
        "prerequisites": [
          "Python 3.9+",
          "pip install ragas datasets"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "from ragas.dataset_schema import SingleTurnSample\nfrom ragas.metrics import Faithfulness\n\nsample = SingleTurnSample(\n    user_input=\"Where was Albert Einstein born?\",\n    response=\"Einstein was born in Ulm, Germany.\",\n    retrieved_contexts=[\"Albert Einstein was born at Ulm, in the Kingdom of Württemberg in the German Empire, on 14 March 1879.\"]\n)\n\nmetric = Faithfulness()\nscore = metric.single_turn_score(sample)\nprint(f\"Faithfulness score: {score}\")",
        "expected_output": "Faithfulness score: 1.0",
        "documentation_url": "https://docs.ragas.io/en/stable/getstarted/",
        "verified": true
      }
    ]
  },
  "developer_resource:guardrails-ai": {
    "available": true,
    "verification_status": "verified",
    "package_name": "guardrails-ai",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install guardrails-ai",
        "source_url": "https://www.guardrailsai.com/docs",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Guardrails AI Documentation",
      "url": "https://www.guardrailsai.com/docs",
      "domain": "guardrailsai.com",
      "verified": true
    },
    "github": {
      "owner": "guardrails-ai",
      "repo": "guardrails",
      "url": "https://github.com/guardrails-ai/guardrails",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://www.guardrailsai.com/docs"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Wrap LLM response with Guard validation",
        "prerequisites": [
          "pip install guardrails-ai openai"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "from guardrails import Guard\nfrom pydantic import BaseModel, Field\n\nclass Pet(BaseModel):\n    name: str = Field(description=\"Name of the pet\")\n    animal: str = Field(description=\"Type of animal\")\n\nguard = Guard.for_pydantic(output_class=Pet)\nresponse = guard(\n    model=\"gpt-4o-mini\",\n    messages=[{\"role\": \"user\", \"content\": \"I have a golden retriever named Buddy.\"}]\n)\nprint(response.validated_output)",
        "expected_output": "{'name': 'Buddy', 'animal': 'dog'}",
        "documentation_url": "https://www.guardrailsai.com/docs/getting_started/quickstart",
        "verified": true
      }
    ]
  },
  "developer_resource:pgvector": {
    "available": true,
    "verification_status": "verified",
    "package_name": "pgvector",
    "installation": [
      {
        "pm": "docker",
        "label": "Docker (PostgreSQL + pgvector)",
        "command": "docker run -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword pgvector/pgvector:pg16",
        "source_url": "https://github.com/pgvector/pgvector",
        "verified": true
      },
      {
        "pm": "pip",
        "label": "Python Driver",
        "command": "pip install pgvector psycopg[binary]",
        "source_url": "https://github.com/pgvector/pgvector-python",
        "verified": true
      }
    ],
    "documentation": {
      "title": "pgvector Documentation",
      "url": "https://github.com/pgvector/pgvector",
      "domain": "github.com",
      "verified": true
    },
    "github": {
      "owner": "pgvector",
      "repo": "pgvector",
      "url": "https://github.com/pgvector/pgvector",
      "license": "PostgreSQL License",
      "default_branch": "master",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "SQL",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/pgvector/pgvector"
      },
      {
        "language": "Python",
        "support_type": "client_library",
        "documentation_url": "https://github.com/pgvector/pgvector-python"
      }
    ],
    "examples": [
      {
        "language": "sql",
        "label": "SQL Schema & Query",
        "title": "Create vector table and query nearest cosine distance",
        "prerequisites": [
          "PostgreSQL with pgvector extension enabled"
        ],
        "env_vars": [],
        "code": "-- Enable pgvector extension\nCREATE EXTENSION IF NOT EXISTS vector;\n\n-- Create table with 3-dimensional embeddings\nCREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));\n\n-- Insert sample vectors\nINSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');\n\n-- Query nearest vectors using L2 distance (<->)\nSELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 1;",
        "expected_output": "id: 1, embedding: [1,2,3]",
        "documentation_url": "https://github.com/pgvector/pgvector",
        "verified": true
      }
    ]
  },
  "developer_resource:copilotkit": {
    "available": true,
    "verification_status": "verified",
    "package_name": "@copilotkit/react-core",
    "installation": [
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install @copilotkit/react-core @copilotkit/react-ui",
        "source_url": "https://docs.copilotkit.ai/",
        "verified": true
      },
      {
        "pm": "pnpm",
        "label": "pnpm",
        "command": "pnpm add @copilotkit/react-core @copilotkit/react-ui",
        "source_url": "https://docs.copilotkit.ai/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "CopilotKit Documentation",
      "url": "https://docs.copilotkit.ai/",
      "domain": "docs.copilotkit.ai",
      "verified": true
    },
    "github": {
      "owner": "CopilotKit",
      "repo": "CopilotKit",
      "url": "https://github.com/CopilotKit/CopilotKit",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "TypeScript / React",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.copilotkit.ai/"
      },
      {
        "language": "JavaScript",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.copilotkit.ai/"
      }
    ],
    "examples": [
      {
        "language": "typescript",
        "label": "React / TypeScript",
        "title": "Wrap App with CopilotKit Provider and Sidebar",
        "prerequisites": [
          "Node.js 18+",
          "React 18+",
          "npm install @copilotkit/react-core @copilotkit/react-ui"
        ],
        "env_vars": [],
        "code": "import { CopilotKit } from '@copilotkit/react-core';\nimport { CopilotSidebar } from '@copilotkit/react-ui';\nimport '@copilotkit/react-ui/styles.css';\n\nexport default function App() {\n  return (\n    <CopilotKit publicApiKey=\"your-copilot-cloud-public-key\">\n      <CopilotSidebar\n        instructions=\"Help the user understand developer resources in DevSpire Nexus.\"\n        labels={{ title: \"Nexus AI Copilot\", initial: \"Hi! Ask me anything about AI frameworks or models.\" }}\n        defaultOpen={true}\n      >\n        <main className=\"p-8\">\n          <h1>DevSpire Nexus Developer Console</h1>\n        </main>\n      </CopilotSidebar>\n    </CopilotKit>\n  );\n}",
        "expected_output": null,
        "documentation_url": "https://docs.copilotkit.ai/quickstart",
        "verified": true
      }
    ]
  },
  "developer_resource:sglang": {
    "available": true,
    "verification_status": "verified",
    "package_name": "sglang",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (CUDA)",
        "command": "pip install \"sglang[all]\"",
        "source_url": "https://sgl-project.github.io/start/install.html",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker",
        "command": "docker run --gpus all -p 30000:30000 --ipc=host lmsysorg/sglang:latest python3 -m sglang.launch_server --model-path meta-llama/Llama-3.2-1B-Instruct --port 30000",
        "source_url": "https://sgl-project.github.io/backend/server_arguments.html",
        "verified": true
      }
    ],
    "documentation": {
      "title": "SGLang Documentation",
      "url": "https://sgl-project.github.io/",
      "domain": "sgl-project.github.io",
      "verified": true
    },
    "github": {
      "owner": "sgl-project",
      "repo": "sglang",
      "url": "https://github.com/sgl-project/sglang",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://sgl-project.github.io/"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://sgl-project.github.io/backend/openai_api_completions.html"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Launch engine and generate text",
        "prerequisites": [
          "Python 3.10+",
          "CUDA GPU",
          "pip install \"sglang[all]\""
        ],
        "env_vars": [],
        "code": "import sglang as sgl\n\n@sgl.function\ndef capital_query(s, country):\n    s += \"What is the capital of \" + country + \"?\\n\"\n    s += sgl.gen(\"answer\", max_tokens=16, stop=\"\\n\")\n\nstate = capital_query.run(country=\"Japan\")\nprint(state[\"answer\"].strip())",
        "expected_output": "Tokyo",
        "documentation_url": "https://sgl-project.github.io/start/quick_start.html",
        "verified": true
      }
    ]
  },
  "developer_resource:localai": {
    "available": true,
    "verification_status": "verified",
    "package_name": "localai",
    "installation": [
      {
        "pm": "docker",
        "label": "Docker (CPU)",
        "command": "docker run -p 8080:8080 --name local-ai -ti localai/localai:latest-cpu",
        "source_url": "https://localai.io/basics/getting_started/",
        "verified": true
      },
      {
        "pm": "curl",
        "label": "Linux / macOS script",
        "command": "curl https://localai.io/install.sh | bash",
        "source_url": "https://localai.io/basics/getting_started/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "LocalAI Documentation",
      "url": "https://localai.io/",
      "domain": "localai.io",
      "verified": true
    },
    "github": {
      "owner": "mudler",
      "repo": "LocalAI",
      "url": "https://github.com/mudler/LocalAI",
      "license": "MIT",
      "default_branch": "master",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://localai.io/features/openai-functions/"
      },
      {
        "language": "CLI",
        "support_type": "official_sdk",
        "documentation_url": "https://localai.io/"
      },
      {
        "language": "Python",
        "support_type": "client_library",
        "documentation_url": "https://localai.io/basics/getting_started/"
      }
    ],
    "examples": [
      {
        "language": "bash",
        "label": "cURL / OpenAI API",
        "title": "Query local model via OpenAI-compatible endpoint",
        "prerequisites": [
          "LocalAI running on localhost:8080"
        ],
        "env_vars": [],
        "code": "curl http://localhost:8080/v1/chat/completions \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"gpt-4\",\n    \"messages\": [{\"role\": \"user\", \"content\": \"Hello, LocalAI!\"}]\n  }'",
        "expected_output": null,
        "documentation_url": "https://localai.io/basics/getting_started/",
        "verified": true
      }
    ]
  },
  "developer_resource:weaviate": {
    "available": true,
    "verification_status": "verified",
    "package_name": "weaviate-client",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (v4 client)",
        "command": "pip install weaviate-client",
        "source_url": "https://weaviate.io/developers/weaviate/quickstart",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "TypeScript Client",
        "command": "npm install weaviate-client",
        "source_url": "https://weaviate.io/developers/weaviate/client-libraries/typescript",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker Server",
        "command": "docker run -p 8080:8080 -p 50051:50051 cr.weaviate.io/semitechnologies/weaviate:latest",
        "source_url": "https://weaviate.io/developers/weaviate/installation/docker-compose",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Weaviate Documentation",
      "url": "https://weaviate.io/developers/weaviate",
      "domain": "weaviate.io",
      "verified": true
    },
    "github": {
      "owner": "weaviate",
      "repo": "weaviate",
      "url": "https://github.com/weaviate/weaviate",
      "license": "BSD-3-Clause",
      "default_branch": "master",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://weaviate.io/developers/weaviate/client-libraries/python"
      },
      {
        "language": "TypeScript / JavaScript",
        "support_type": "official_sdk",
        "documentation_url": "https://weaviate.io/developers/weaviate/client-libraries/typescript"
      },
      {
        "language": "Go",
        "support_type": "official_sdk",
        "documentation_url": "https://weaviate.io/developers/weaviate/client-libraries/go"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python (v4 Client)",
        "title": "Connect to embedded Weaviate and create a collection",
        "prerequisites": [
          "Python 3.9+",
          "pip install weaviate-client"
        ],
        "env_vars": [],
        "code": "import weaviate\n\nclient = weaviate.connect_to_embedded()\nprint(\"Is Weaviate connected?\", client.is_connected())\n\narticles = client.collections.create(name=\"Article\")\narticles.data.insert(properties={\"title\": \"Getting Started with Vector Databases\"})\nprint(\"Total items:\", len(articles))\n\nclient.close()",
        "expected_output": "Is Weaviate connected? True\nTotal items: 1",
        "documentation_url": "https://weaviate.io/developers/weaviate/quickstart/local",
        "verified": true
      }
    ]
  },
  "developer_resource:milvus": {
    "available": true,
    "verification_status": "verified",
    "package_name": "pymilvus",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (Milvus Lite embedded)",
        "command": "pip install pymilvus milvus-lite",
        "source_url": "https://milvus.io/docs/quickstart.md",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "Node.js SDK",
        "command": "npm install @zilliz/milvus2-sdk-node",
        "source_url": "https://milvus.io/docs/install-node-sdk.md",
        "verified": true
      },
      {
        "pm": "docker",
        "label": "Docker Standalone",
        "command": "curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o standalone_embed.sh && bash standalone_embed.sh start",
        "source_url": "https://milvus.io/docs/install_standalone-docker.md",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Milvus Documentation",
      "url": "https://milvus.io/docs",
      "domain": "milvus.io",
      "verified": true
    },
    "github": {
      "owner": "milvus-io",
      "repo": "milvus",
      "url": "https://github.com/milvus-io/milvus",
      "license": "Apache 2.0",
      "default_branch": "master",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://milvus.io/docs/quickstart.md"
      },
      {
        "language": "Node.js",
        "support_type": "official_sdk",
        "documentation_url": "https://milvus.io/docs/install-node-sdk.md"
      },
      {
        "language": "Go",
        "support_type": "official_sdk",
        "documentation_url": "https://milvus.io/docs/install-go-sdk.md"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python (Milvus Lite)",
        "title": "Create local collection and insert vector entities",
        "prerequisites": [
          "Python 3.8+",
          "pip install pymilvus milvus-lite"
        ],
        "env_vars": [],
        "code": "from pymilvus import MilvusClient\n\nclient = MilvusClient(\"./milvus_demo.db\")\nif client.has_collection(\"demo\"):\n    client.drop_collection(\"demo\")\n\nclient.create_collection(collection_name=\"demo\", dimension=4)\nclient.insert(collection_name=\"demo\", data=[{\"id\": 0, \"vector\": [0.35, 0.42, 0.12, 0.81], \"color\": \"blue\"}])\nprint(\"Milvus Lite initialized successfully.\")",
        "expected_output": "Milvus Lite initialized successfully.",
        "documentation_url": "https://milvus.io/docs/quickstart.md",
        "verified": true
      }
    ]
  },
  "developer_resource:together-ai": {
    "available": true,
    "verification_status": "verified",
    "package_name": "together",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install together",
        "source_url": "https://docs.together.ai/docs/quickstart",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install together-ai",
        "source_url": "https://docs.together.ai/docs/quickstart",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Together AI Documentation",
      "url": "https://docs.together.ai/",
      "domain": "docs.together.ai",
      "verified": true
    },
    "github": {
      "owner": "togethercomputer",
      "repo": "together-python",
      "url": "https://github.com/togethercomputer/together-python",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/togethercomputer/together-python"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://github.com/togethercomputer/together-typescript"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://docs.together.ai/reference"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Run fast inference on open-weight foundation models",
        "prerequisites": [
          "Python 3.9+",
          "pip install together"
        ],
        "env_vars": [
          "TOGETHER_API_KEY"
        ],
        "code": "import os\nfrom together import Together\n\nclient = Together(api_key=os.environ[\"TOGETHER_API_KEY\"])\nresponse = client.chat.completions.create(\n    model=\"meta-llama/Llama-3.3-70B-Instruct-Turbo\",\n    messages=[{\"role\": \"user\", \"content\": \"What is the distance from Earth to Moon?\"}]\n)\nprint(response.choices[0].message.content)",
        "expected_output": "The average distance from the Earth to the Moon is about 384,400 kilometers (238,855 miles).",
        "documentation_url": "https://docs.together.ai/docs/quickstart",
        "verified": true
      }
    ]
  },
  "developer_resource:replicate": {
    "available": true,
    "verification_status": "verified",
    "package_name": "replicate",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install replicate",
        "source_url": "https://replicate.com/docs/get-started/python",
        "verified": true
      },
      {
        "pm": "npm",
        "label": "npm",
        "command": "npm install replicate",
        "source_url": "https://replicate.com/docs/get-started/javascript",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Replicate Documentation",
      "url": "https://replicate.com/docs",
      "domain": "replicate.com",
      "verified": true
    },
    "github": {
      "owner": "replicate",
      "repo": "replicate-python",
      "url": "https://github.com/replicate/replicate-python",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://replicate.com/docs/get-started/python"
      },
      {
        "language": "JavaScript / TypeScript",
        "support_type": "official_sdk",
        "documentation_url": "https://replicate.com/docs/get-started/javascript"
      },
      {
        "language": "REST API",
        "support_type": "rest_api",
        "documentation_url": "https://replicate.com/docs/reference/http"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Run open-source model with Replicate API",
        "prerequisites": [
          "Python 3.8+",
          "pip install replicate"
        ],
        "env_vars": [
          "REPLICATE_API_TOKEN"
        ],
        "code": "import replicate\n\noutput = replicate.run(\n    \"meta/meta-llama-3-8b-instruct\",\n    input={\"prompt\": \"Give me a one-line motivational quote for developers.\"}\n)\nprint(\"\".join(output))",
        "expected_output": null,
        "documentation_url": "https://replicate.com/docs/get-started/python",
        "verified": true
      }
    ]
  },
  "developer_resource:haystack": {
    "available": true,
    "verification_status": "verified",
    "package_name": "haystack-ai",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (Haystack 2.x)",
        "command": "pip install haystack-ai",
        "source_url": "https://docs.haystack.deepset.ai/docs/intro",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Haystack Documentation",
      "url": "https://docs.haystack.deepset.ai/",
      "domain": "docs.haystack.deepset.ai",
      "verified": true
    },
    "github": {
      "owner": "deepset-ai",
      "repo": "haystack",
      "url": "https://github.com/deepset-ai/haystack",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.haystack.deepset.ai/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Build a Pipeline with PromptBuilder and OpenAIGenerator",
        "prerequisites": [
          "Python 3.9+",
          "pip install haystack-ai"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "from haystack import Pipeline\nfrom haystack.components.builders import PromptBuilder\nfrom haystack.components.generators import OpenAIGenerator\n\ntemplate = \"Translate this English sentence to German: {{ sentence }}\"\nprompt_builder = PromptBuilder(template=template)\ngenerator = OpenAIGenerator(model=\"gpt-4o-mini\")\n\npipe = Pipeline()\npipe.add_component(\"prompt_builder\", prompt_builder)\npipe.add_component(\"generator\", generator)\npipe.connect(\"prompt_builder\", \"generator\")\n\nresult = pipe.run({\"prompt_builder\": {\"sentence\": \"Good morning!\"}})\nprint(result[\"generator\"][\"replies\"][0])",
        "expected_output": "Guten Morgen!",
        "documentation_url": "https://docs.haystack.deepset.ai/docs/creating-pipelines",
        "verified": true
      }
    ]
  },
  "developer_resource:autogen": {
    "available": true,
    "verification_status": "verified",
    "package_name": "autogen-agentchat",
    "installation": [
      {
        "pm": "pip",
        "label": "pip (AutoGen 0.4+)",
        "command": "pip install -U autogen-agentchat autogen-ext[openai]",
        "source_url": "https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/quick-start.html",
        "verified": true
      }
    ],
    "documentation": {
      "title": "AutoGen Documentation",
      "url": "https://microsoft.github.io/autogen/",
      "domain": "microsoft.github.io",
      "verified": true
    },
    "github": {
      "owner": "microsoft",
      "repo": "autogen",
      "url": "https://github.com/microsoft/autogen",
      "license": "MIT",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://microsoft.github.io/autogen/"
      },
      {
        "language": ".NET / C#",
        "support_type": "official_sdk",
        "documentation_url": "https://microsoft.github.io/autogen/dotnet/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Define an AssistantAgent and run a multi-turn task",
        "prerequisites": [
          "Python 3.10+",
          "pip install -U autogen-agentchat autogen-ext[openai]"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import asyncio\nfrom autogen_agentchat.agents import AssistantAgent\nfrom autogen_ext.models.openai import OpenAIChatCompletionClient\n\nasync def main():\n    model_client = OpenAIChatCompletionClient(model=\"gpt-4o-mini\")\n    agent = AssistantAgent(\"assistant\", model_client=model_client)\n    response = await agent.run(task=\"Explain in 10 words what an AI Agent is.\")\n    print(response.messages[-1].content)\n\nasyncio.run(main())",
        "expected_output": "An autonomous software entity perceiving its environment and taking actions.",
        "documentation_url": "https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/quick-start.html",
        "verified": true
      }
    ]
  },
  "developer_resource:outlines": {
    "available": true,
    "verification_status": "verified",
    "package_name": "outlines",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install outlines",
        "source_url": "https://dottxt-ai.github.io/outlines/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "Outlines Documentation",
      "url": "https://dottxt-ai.github.io/outlines/",
      "domain": "dottxt-ai.github.io",
      "verified": true
    },
    "github": {
      "owner": "dottxt-ai",
      "repo": "outlines",
      "url": "https://github.com/dottxt-ai/outlines",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://dottxt-ai.github.io/outlines/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Generate structured JSON guaranteed by Pydantic schema",
        "prerequisites": [
          "Python 3.9+",
          "pip install outlines openai pydantic"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "import outlines\nfrom pydantic import BaseModel\n\nclass Person(BaseModel):\n    name: str\n    age: int\n\nmodel = outlines.models.openai(\"gpt-4o-mini\")\ngenerator = outlines.generate.json(model, Person)\nperson = generator(\"Barack Obama was born in 1961.\")\nprint(person.name, person.age)",
        "expected_output": "Barack Obama 1961",
        "documentation_url": "https://dottxt-ai.github.io/outlines/welcome/",
        "verified": true
      }
    ]
  },
  "developer_resource:nemo-guardrails": {
    "available": true,
    "verification_status": "verified",
    "package_name": "nemoguardrails",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install nemoguardrails",
        "source_url": "https://docs.nvidia.com/nemo/guardrails/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "NeMo Guardrails Documentation",
      "url": "https://docs.nvidia.com/nemo/guardrails/",
      "domain": "docs.nvidia.com",
      "verified": true
    },
    "github": {
      "owner": "NVIDIA",
      "repo": "NeMo-Guardrails",
      "url": "https://github.com/NVIDIA/NeMo-Guardrails",
      "license": "Apache 2.0",
      "default_branch": "develop",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.nvidia.com/nemo/guardrails/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python",
        "title": "Initialize LLMRails from configuration and generate safe response",
        "prerequisites": [
          "Python 3.9+",
          "pip install nemoguardrails"
        ],
        "env_vars": [
          "OPENAI_API_KEY"
        ],
        "code": "from nemoguardrails import RailsConfig, LLMRails\n\nyaml_content = \"\"\"\nmodels:\n  - type: main\n    engine: openai\n    model: gpt-4o-mini\n\"\"\"\nconfig = RailsConfig.from_content(yaml_content)\nrails = LLMRails(config)\nresponse = rails.generate(messages=[{\"role\": \"user\", \"content\": \"Hello world!\"}])\nprint(response[\"content\"])",
        "expected_output": "Hello! How can I help you today?",
        "documentation_url": "https://docs.nvidia.com/nemo/guardrails/user_guides/getting_started.html",
        "verified": true
      }
    ]
  },
  "developer_resource:bentoml": {
    "available": true,
    "verification_status": "verified",
    "package_name": "bentoml",
    "installation": [
      {
        "pm": "pip",
        "label": "pip",
        "command": "pip install bentoml",
        "source_url": "https://docs.bentoml.com/en/latest/",
        "verified": true
      }
    ],
    "documentation": {
      "title": "BentoML Documentation",
      "url": "https://docs.bentoml.com/",
      "domain": "docs.bentoml.com",
      "verified": true
    },
    "github": {
      "owner": "bentoml",
      "repo": "BentoML",
      "url": "https://github.com/bentoml/BentoML",
      "license": "Apache 2.0",
      "default_branch": "main",
      "verified": true
    },
    "supported_languages": [
      {
        "language": "Python",
        "support_type": "official_sdk",
        "documentation_url": "https://docs.bentoml.com/"
      }
    ],
    "examples": [
      {
        "language": "python",
        "label": "Python Service",
        "title": "Define an HTTP service endpoint with BentoML",
        "prerequisites": [
          "Python 3.9+",
          "pip install bentoml"
        ],
        "env_vars": [],
        "code": "import bentoml\n\n@bentoml.service(resources={\"cpu\": \"2\"}, traffic={\"timeout\": 10})\nclass SummarizationService:\n    @bentoml.api\n    def summarize(self, text: str) -> str:\n        return f\"Summary: {text[:50]}...\"\n",
        "expected_output": null,
        "documentation_url": "https://docs.bentoml.com/en/latest/get-started/quickstart.html",
        "verified": true
      }
    ]
  }
};
