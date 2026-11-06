// Comprehensive mapping script for all 300 AI models in DevSpire Nexus
const fs = require('fs');
const path = require('path');

const models = JSON.parse(fs.readFileSync('.qa/source/ai-models.json', 'utf8'));
const oldModels = JSON.parse(fs.readFileSync('.qa/legacy/models.json', 'utf8'));

// Build dictionary indexed by canonical_id
const specs = {
  // [18]
  "model:gpt-4o": { params: null, context: "128K", context_k: 128, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [19]
  "model:claude-3-5-sonnet": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [20]
  "model:gemini-1-5-pro": { params: null, context: "1M", context_k: 1000, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [21]
  "model:deepseek-r1": { params: "671B MoE (37B act)", context: "128K", context_k: 128, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [22]
  "model:llama-3-1": { params: "8B / 70B / 405B", context: "128K", context_k: 128, license: "Llama 3.1 Community", license_group: "Permissive Community" },
  // [23]
  "model:mistral-large": { params: null, context: "128K", context_k: 128, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [24]
  "model:qwen2-5": { params: "0.5B–72B", context: "128K", context_k: 128, license: "Qwen License", license_group: "Permissive Community" },
  // [25]
  "model:flux-1-schnell": { params: "12B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [26]
  "model:whisper": { params: "39M–1.55B", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [27]
  "model:text-embedding-3-large": { params: null, context: "8K", context_k: 8, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [28]
  "model:stable-diffusion-3-5": { params: "2.5B / 8B", context: null, context_k: null, license: "Stability Community", license_group: "Permissive Community" },
  // [29]
  "model:phi-3": { params: "3.8B–14B", context: "128K", context_k: 128, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [30]
  "model:command-r-plus": { params: "104B", context: "128K", context_k: 128, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [31]
  "model:bge-m3": { params: "570M", context: "8K", context_k: 8, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [32]
  "model:falcon-180b": { params: "180B", context: "4K", context_k: 4, license: "Falcon-180B TII", license_group: "Permissive Community" },
  // [33]
  "model:musicgen": { params: "300M–3.3B", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [68]
  "model:openai-o1": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [69]
  "model:gemma-2": { params: "2.6B–27B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [70]
  "model:claude-3-5-haiku": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [71]
  "model:deepseek-v3": { params: "671B MoE (37B act)", context: "128K", context_k: 128, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [72]
  "model:llama-3-2": { params: "1B / 3B / 11B / 90B", context: "128K", context_k: 128, license: "Llama 3.2 Community", license_group: "Permissive Community" },
  // [73]
  "model:codestral": { params: "22B", context: "32K", context_k: 32, license: "Mistral Non-Production", license_group: "Non-Commercial / Research" },
  // [74]
  "model:sam-2": { params: "224M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [75]
  "model:dinov2": { params: "ViT-S–ViT-g (22M–1.1B)", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [76]
  "model:clip": { params: "86M–428M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [77]
  "model:hunyuan-video": { params: "13B", context: null, context_k: null, license: "Apache 2.0 + Tencent Community", license_group: "Permissive Community" },
  // [78]
  "model:cogvideox": { params: "2B / 5B", context: null, context_k: null, license: "Apache 2.0 + Community", license_group: "Permissive Community" },
  // [79]
  "model:voyage-3": { params: null, context: "32K", context_k: 32, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [80]
  "model:cohere-embed-v3": { params: null, context: "512", context_k: 1, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [81]
  "model:xtts-v2": { params: "467M", context: null, context_k: null, license: "Coqui Public Model License", license_group: "Non-Commercial / Research" },
  // [82]
  "model:mistral-nemo": { params: "12B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [83]
  "model:jina-embeddings-v3": { params: "570M", context: "8K", context_k: 8, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [118]
  "model:gemini-1-5-flash": { params: null, context: "1M", context_k: 1000, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [119]
  "model:gpt-4o-mini": { params: null, context: "128K", context_k: 128, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [120]
  "model:qwen2-5-coder": { params: "0.5B–32B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [121]
  "model:qwen2-vl": { params: "2B–72B", context: "128K", context_k: 128, license: "Apache 2.0 / Qwen License", license_group: "Permissive Community" },
  // [122]
  "model:deepseek-coder-v2": { params: "16B / 236B MoE", context: "128K", context_k: 128, license: "MIT (Lite) / DeepSeek License", license_group: "Permissive Community" },
  // [123]
  "model:pixtral-12b": { params: "12B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [124]
  "model:flux-1-dev": { params: "12B", context: null, context_k: null, license: "FLUX Dev Non-Commercial", license_group: "Non-Commercial / Research" },
  // [125]
  "model:sdxl": { params: "3.5B", context: null, context_k: null, license: "CreativeML OpenRAIL++-M", license_group: "Permissive Community" },
  // [126]
  "model:kolors": { params: "2.7B", context: null, context_k: null, license: "Apache 2.0 + Kolors Community", license_group: "Permissive Community" },
  // [127]
  "model:bark": { params: "Small / Large", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [128]
  "model:whisper-large-v3-turbo": { params: "809M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [129]
  "model:bge-reranker-v2": { params: "570M", context: "8K", context_k: 8, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [130]
  "model:cohere-rerank-3": { params: null, context: "4K", context_k: 4, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [131]
  "model:internvl-2": { params: "1B–108B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [132]
  "model:molmo-72b": { params: "72B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [133]
  "model:moondream2": { params: "1.6B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [168]
  "model:openai-o3-mini": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [169]
  "model:llama-3": { params: "8B / 70B", context: "8K", context_k: 8, license: "Llama 3 Community", license_group: "Permissive Community" },
  // [170]
  "model:mistral-7b": { params: "7.3B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [171]
  "model:mixtral-8x7b": { params: "46.7B MoE (12.9B act)", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [172]
  "model:mixtral-8x22b": { params: "141B MoE (39B act)", context: "64K", context_k: 64, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [173]
  "model:qwen2-5-math": { params: "1.5B / 7B / 72B", context: "4K", context_k: 4, license: "Apache 2.0 / Qwen License", license_group: "Permissive Community" },
  // [174]
  "model:deepseek-v2-5": { params: "236B MoE (21B act)", context: "128K", context_k: 128, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [175]
  "model:gemma": { params: "2B / 7B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [176]
  "model:stable-audio-open": { params: "1.2B", context: null, context_k: null, license: "Stability Community", license_group: "Permissive Community" },
  // [177]
  "model:stable-video-diffusion": { params: "1.5B", context: null, context_k: null, license: "Stability Community", license_group: "Permissive Community" },
  // [178]
  "model:minitron": { params: "4B / 8B", context: "8K", context_k: 8, license: "NVIDIA Open Model License", license_group: "Permissive Community" },
  // [179]
  "model:jukebox": { params: "1B–5B", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [180]
  "model:e5-embeddings": { params: "33M–335M", context: "512", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [181]
  "model:nomic-embed-text": { params: "137M", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [182]
  "model:yolov8": { params: "3.2M–68.2M", context: null, context_k: null, license: "AGPL-3.0", license_group: "Non-Commercial / Research" },
  // [183]
  "model:grounding-dino": { params: "172M–341M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [218]
  "model:phi-4": { params: "14B", context: "16K", context_k: 16, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [219]
  "model:codegemma": { params: "2B / 7B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [220]
  "model:starcoder2": { params: "3B / 7B / 15B", context: "16K", context_k: 16, license: "OpenRAIL-M", license_group: "Permissive Community" },
  // [221]
  "model:deepseek-vl2": { params: "1B / 2.8B / 4.5B act", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [222]
  "model:llava-next": { params: "7B / 13B / 34B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [223]
  "model:florence-2": { params: "0.23B / 0.77B", context: "1K", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [224]
  "model:sam-1": { params: "636M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [225]
  "model:depth-anything-v2": { params: "25M–1.3B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [226]
  "model:fastsam": { params: "68M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [227]
  "model:stable-diffusion-2-1": { params: "865M", context: null, context_k: null, license: "CreativeML OpenRAIL++-M", license_group: "Permissive Community" },
  // [228]
  "model:controlnet": { params: "1.4B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [229]
  "model:animatediff": { params: "Motion Module", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [230]
  "model:triposr": { params: "LRM Transformer", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [231]
  "model:instantmesh": { params: "LRM + Diffusion", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [232]
  "model:chronos": { params: "20M–710M", context: "512", context_k: 1, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [233]
  "model:whisperx": { params: "Whisper Pipeline", context: null, context_k: null, license: "BSD-2-Clause", license_group: "MIT / Apache 2.0" },
  // [268]
  "model:paligamma-2": { params: "3B / 10B / 28B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [269]
  "model:smollm2": { params: "135M / 360M / 1.7B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [270]
  "model:esm3": { params: "1.4B / 98B", context: "4K", context_k: 4, license: "EvolutionaryScale Community", license_group: "Non-Commercial / Research" },
  // [271]
  "model:alphafold-3": { params: null, context: null, context_k: null, license: "Non-Commercial Research", license_group: "Non-Commercial / Research" },
  // [272]
  "model:seamlessm4t": { params: "2.3B", context: null, context_k: null, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [273]
  "model:openvoice": { params: "300M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [274]
  "model:solar-10-7b": { params: "10.7B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [275]
  "model:minicpm-v": { params: "3B / 8B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [276]
  "model:video-llava": { params: "7B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [277]
  "model:biogpt": { params: "347M / 1.5B", context: "2K", context_k: 2, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [278]
  "model:command-r": { params: "35B", context: "128K", context_k: 128, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [279]
  "model:mms-meta": { params: "1B", context: null, context_k: null, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [280]
  "model:falcon-2-11b": { params: "11B", context: "4K", context_k: 4, license: "Falcon License", license_group: "Permissive Community" },
  // [281]
  "model:segformer": { params: "3.8M–84.7M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [282]
  "model:internvideo2": { params: "1B–6B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [283]
  "model:qwen2-audio": { params: "7B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [318]
  "model:med-palm-2": { params: null, context: "32K", context_k: 32, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [319]
  "model:codellama": { params: "7B / 13B / 34B / 70B", context: "100K", context_k: 100, license: "Llama 2 Community", license_group: "Permissive Community" },
  // [320]
  "model:deepseek-math": { params: "7B", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [321]
  "model:llava-1-5": { params: "7B / 13B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [322]
  "model:musiclm": { params: null, context: null, context_k: null, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [323]
  "model:dbrx": { params: "132B MoE (36B act)", context: "32K", context_k: 32, license: "Databricks Open Model", license_group: "Permissive Community" },
  // [324]
  "model:sd-turbo": { params: "860M", context: null, context_k: null, license: "Stability Non-Commercial", license_group: "Non-Commercial / Research" },
  // [325]
  "model:lcm": { params: "Distilled LoRA", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [326]
  "model:distil-whisper": { params: "756M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [327]
  "model:nv-embed": { params: "7B", context: "4K", context_k: 4, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [328]
  "model:instructpix2pix": { params: "860M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [329]
  "model:cogview3": { params: "3B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [330]
  "model:yolos": { params: "6.5M–86M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [331]
  "model:timesnet": { params: "Deep 2D-Variation", context: "1K", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [332]
  "model:cosyvoice": { params: "300M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [333]
  "model:yi-coder": { params: "1.5B / 9B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [368]
  "model:llama-2": { params: "7B / 13B / 70B", context: "4K", context_k: 4, license: "Llama 2 Community", license_group: "Permissive Community" },
  // [369]
  "model:mistral-small": { params: null, context: "32K", context_k: 32, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [370]
  "model:deepseek-coder-v1": { params: "1.3B / 6.7B / 33B", context: "16K", context_k: 16, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [371]
  "model:claude-3-opus": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [372]
  "model:gpt-4-turbo": { params: null, context: "128K", context_k: 128, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [373]
  "model:gemini-2-0-flash": { params: null, context: "1M", context_k: 1000, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [374]
  "model:hq-sam": { params: "SAM + HQ Output Token", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [375]
  "model:blip-2": { params: "ViT + Q-Former (3.8B–14B)", context: "512", context_k: 1, license: "BSD-3-Clause", license_group: "MIT / Apache 2.0" },
  // [376]
  "model:instructblip": { params: "7B / 13B", context: "512", context_k: 1, license: "BSD-3-Clause", license_group: "MIT / Apache 2.0" },
  // [377]
  "model:open-sora": { params: "STDiT Diffusion", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [378]
  "model:stable-cascade": { params: "1.4B–3.6B", context: null, context_k: null, license: "Stability Non-Commercial", license_group: "Non-Commercial / Research" },
  // [379]
  "model:sv3d": { params: "Video Diffusion", context: null, context_k: null, license: "Stability Community", license_group: "Permissive Community" },
  // [380]
  "model:point-e": { params: "40M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [381]
  "model:shap-e": { params: "Implicit Diffusion", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [382]
  "model:conformer-ctc": { params: "120M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [383]
  "model:uniaudio": { params: "1B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [418]
  "model:starcoder": { params: "15.5B", context: "8K", context_k: 8, license: "OpenRAIL-M", license_group: "Permissive Community" },
  // [419]
  "model:codegeex4": { params: "9B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [420]
  "model:snowflake-arctic": { params: "480B MoE (17B act)", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [421]
  "model:gemma-2-9b": { params: "9B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [422]
  "model:phi-3-5-moe": { params: "16x3.8B MoE (6.6B act)", context: "128K", context_k: 128, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [423]
  "model:qwen2-5-coder-32b": { params: "32.5B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [424]
  "model:opencodeinterpreter": { params: "6.7B / 33B", context: "16K", context_k: 16, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [425]
  "model:cogvlm": { params: "17B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [426]
  "model:deepseek-vl": { params: "1.3B / 7B", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [427]
  "model:llava-next-video": { params: "7B / 34B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [428]
  "model:video-chatgpt": { params: "7B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [429]
  "model:animatediff-lightning": { params: "Motion Module", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [430]
  "model:stable-audio-2": { params: "Diffusion", context: null, context_k: null, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [431]
  "model:audioldm-2": { params: "350M–750M", context: null, context_k: null, license: "CC BY-NC-SA 4.0", license_group: "Non-Commercial / Research" },
  // [432]
  "model:musicgen-melody": { params: "1.5B", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [433]
  "model:graphormer": { params: "Graph Transformer", context: "1K", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [468]
  "model:llama-3-3-70b": { params: "70B", context: "128K", context_k: 128, license: "Llama 3.3 Community", license_group: "Permissive Community" },
  // [469]
  "model:deepseek-r1-distill-qwen": { params: "1.5B / 7B / 14B / 32B", context: "128K", context_k: 128, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [470]
  "model:deepseek-r1-distill-llama": { params: "8B / 70B", context: "128K", context_k: 128, license: "Llama 3.1 Community", license_group: "Permissive Community" },
  // [471]
  "model:mistral-large-2": { params: "123B", context: "128K", context_k: 128, license: "Mistral Research", license_group: "Non-Commercial / Research" },
  // [472]
  "model:codestral-mamba": { params: "7B", context: "256K", context_k: 256, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [473]
  "model:gemma-2-27b": { params: "27B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [474]
  "model:qwen2-vl-72b": { params: "72B", context: "128K", context_k: 128, license: "Qwen License", license_group: "Permissive Community" },
  // [475]
  "model:internlm2-5": { params: "7B / 20B", context: "1M", context_k: 1000, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [476]
  "model:claude-3-haiku": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [477]
  "model:whisper-large-v2": { params: "1.55B", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [478]
  "model:bge-large-en-v1-5": { params: "335M", context: "512", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [479]
  "model:jina-reranker-v2": { params: "278M", context: "1K", context_k: 1, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [480]
  "model:crm-3d": { params: "Convolutional Reconstruction", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [481]
  "model:openshape": { params: "Point Cloud Alignment", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [482]
  "model:mobilevlm": { params: "1.4B / 3B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [483]
  "model:rt-2": { params: "55B", context: null, context_k: null, license: "Proprietary Research", license_group: "Non-Commercial / Research" },
  // [518]
  "model:llama-3-2-vision": { params: "11B / 90B", context: "128K", context_k: 128, license: "Llama 3.2 Community", license_group: "Permissive Community" },
  // [519]
  "model:qwen2-5-1m": { params: "7B / 14B", context: "1M", context_k: 1000, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [520]
  "model:deepseek-coder-v2-lite": { params: "16B MoE (2.4B act)", context: "128K", context_k: 128, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [521]
  "model:gemma-2-2b": { params: "2.6B", context: "8K", context_k: 8, license: "Gemma Terms of Use", license_group: "Permissive Community" },
  // [522]
  "model:phi-3-5-vision": { params: "4.2B", context: "128K", context_k: 128, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [523]
  "model:yi-large": { params: null, context: "128K", context_k: 128, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [524]
  "model:granite-3-0": { params: "2B / 8B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [525]
  "model:nemotron-4-340b": { params: "340B", context: "4K", context_k: 4, license: "NVIDIA Open Model License", license_group: "Permissive Community" },
  // [526]
  "model:whisper-tiny": { params: "39M", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [527]
  "model:chattts": { params: "Acoustic Transformer", context: null, context_k: null, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [528]
  "model:f5-tts": { params: "DiT Flow-Matching", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [529]
  "model:stable-diffusion-1-5": { params: "860M", context: null, context_k: null, license: "CreativeML OpenRAIL-M", license_group: "Permissive Community" },
  // [530]
  "model:pixart-alpha": { params: "0.6B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [531]
  "model:pixart-sigma": { params: "0.6B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [532]
  "model:zero123": { params: "Diffusion Viewpoint", context: null, context_k: null, license: "CC BY-NC 4.0", license_group: "Non-Commercial / Research" },
  // [533]
  "model:openvla": { params: "7B", context: "4K", context_k: 4, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [568]
  "model:internvl-1-5": { params: "26B", context: "4K", context_k: 4, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [569]
  "model:qwen-vl-chat": { params: "9.6B", context: "8K", context_k: 8, license: "Qwen License", license_group: "Permissive Community" },
  // [570]
  "model:qwen1-5": { params: "0.5B–72B", context: "32K", context_k: 32, license: "Apache 2.0 / Qwen License", license_group: "Permissive Community" },
  // [571]
  "model:llama-guard-2": { params: "8B", context: "8K", context_k: 8, license: "Llama 3 Community", license_group: "Permissive Community" },
  // [572]
  "model:prompt-guard": { params: "86M", context: "512", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [573]
  "model:wizardcoder": { params: "15B / 33B", context: "16K", context_k: 16, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [574]
  "model:wizardmath": { params: "7B / 13B / 70B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [575]
  "model:yi-34b": { params: "34B", context: "200K", context_k: 200, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [576]
  "model:yi-1-5": { params: "6B / 9B / 34B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [577]
  "model:baichuan-2": { params: "7B / 13B", context: "4K", context_k: 4, license: "Baichuan Community", license_group: "Permissive Community" },
  // [578]
  "model:glm-4-9b": { params: "9B", context: "128K", context_k: 128, license: "GLM-4 License", license_group: "Permissive Community" },
  // [579]
  "model:mistral-embed": { params: null, context: "8K", context_k: 8, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [580]
  "model:voyage-code-2": { params: null, context: "16K", context_k: 16, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [581]
  "model:gte-qwen2": { params: "1.5B / 7B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [582]
  "model:granite-code": { params: "3B–34B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [583]
  "model:openelm": { params: "270M–3B", context: "2K", context_k: 2, license: "Apple Sample Code", license_group: "Permissive Community" },
  // [584]
  "model:flux-1-pro": { params: "12B", context: null, context_k: null, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [618]
  "model:internvl-2-5": { params: "1B–78B", context: "32K", context_k: 32, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [619]
  "model:qwen2-5-coder-7b": { params: "7B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [620]
  "model:qwen2-5-coder-14b": { params: "14B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [621]
  "model:deepseek-v2": { params: "236B MoE (21B act)", context: "128K", context_k: 128, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [622]
  "model:deepseek-moe-16b": { params: "16B MoE (2.8B act)", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [623]
  "model:granite-guardian-3-0": { params: "2B / 8B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [624]
  "model:chameleon-30b": { params: "7B / 30B", context: "4K", context_k: 4, license: "Chameleon Research License", license_group: "Non-Commercial / Research" },
  // [625]
  "model:jamba-1-5-mini": { params: "52B MoE (12B act)", context: "256K", context_k: 256, license: "AI21 Open Model License", license_group: "Permissive Community" },
  // [626]
  "model:jamba-1-5-large": { params: "398B MoE (94B act)", context: "256K", context_k: 256, license: "AI21 Open Model License", license_group: "Permissive Community" },
  // [627]
  "model:olmo-7b": { params: "7B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [628]
  "model:olmoe-1b-7b": { params: "7B MoE (1B act)", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [629]
  "model:bge-en-icl": { params: "7B", context: "8K", context_k: 8, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [630]
  "model:snowflake-arctic-embed-m": { params: "110M", context: "512", context_k: 1, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [631]
  "model:nomic-embed-vision": { params: "137M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [632]
  "model:cohere-rerank-v3": { params: null, context: "4K", context_k: 4, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [633]
  "model:jina-embeddings-v2-base-en": { params: "161M", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [634]
  "model:lgm-3d": { params: "Gaussian Splatting", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [668]
  "model:qwen2-5-coder-1-5b": { params: "1.5B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [669]
  "model:qwen2-5-coder-0-5b": { params: "0.5B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [670]
  "model:qwen2-5-32b": { params: "32.5B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [671]
  "model:qwen2-5-14b": { params: "14B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [672]
  "model:deepseek-coder-6-7b": { params: "6.7B", context: "16K", context_k: 16, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [673]
  "model:deepseek-coder-33b": { params: "33B", context: "16K", context_k: 16, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [674]
  "model:deepseek-v2-lite": { params: "16B MoE (2.4B act)", context: "128K", context_k: 128, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [675]
  "model:glm-4v-9b": { params: "9B", context: "128K", context_k: 128, license: "GLM-4 License", license_group: "Permissive Community" },
  // [676]
  "model:cogagent": { params: "18B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [677]
  "model:internvl2-8b": { params: "8B", context: "32K", context_k: 32, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [678]
  "model:internvl2-4b": { params: "4B", context: "32K", context_k: 32, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [679]
  "model:minicpm-3-4b": { params: "4B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [680]
  "model:minicpm-v-2-6": { params: "8B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [681]
  "model:bge-multilingual-gemma2": { params: "2.6B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [682]
  "model:jina-clip-v1": { params: "223M", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [683]
  "model:jina-reranker-v1": { params: "137M", context: "512", context_k: 1, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [684]
  "model:sdxl-turbo": { params: "3.5B", context: null, context_k: null, license: "Stability Community", license_group: "Permissive Community" },
  // [718]
  "model:qwen2-math-72b": { params: "72B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [719]
  "model:qwen2-math-7b": { params: "7B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [720]
  "model:qwen2-math-1-5b": { params: "1.5B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [721]
  "model:deepseek-prover-v1-5": { params: "7B", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [722]
  "model:numina-math-7b": { params: "7B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [723]
  "model:llama-3-1-nemotron-70b": { params: "70B", context: "128K", context_k: 128, license: "Llama 3.1 Community", license_group: "Permissive Community" },
  // [724]
  "model:llama-3-1-nemotron-51b": { params: "51B", context: "128K", context_k: 128, license: "Llama 3.1 Community", license_group: "Permissive Community" },
  // [725]
  "model:falcon-mamba-7b": { params: "7B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [726]
  "model:internlm2-5-7b": { params: "7B", context: "1M", context_k: 1000, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [727]
  "model:internlm2-5-20b": { params: "20B", context: "1M", context_k: 1000, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [728]
  "model:bge-reranker-large": { params: "560M", context: "512", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [729]
  "model:bge-base-en-v1-5": { params: "110M", context: "512", context_k: 1, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [730]
  "model:gte-base-en-v1-5": { params: "110M", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [731]
  "model:stella-en-1-5b": { params: "1.5B", context: "8K", context_k: 8, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [732]
  "model:stella-en-400m": { params: "435M", context: "8K", context_k: 8, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [733]
  "model:open-sora-plan": { params: "DiT Video", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [734]
  "model:cogvideox-5b": { params: "5B", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [768]
  "model:qwen2-72b": { params: "72B", context: "128K", context_k: 128, license: "Qwen License", license_group: "Permissive Community" },
  // [769]
  "model:qwen2-57b-a14b": { params: "57B MoE (14B act)", context: "64K", context_k: 64, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [770]
  "model:qwen2-7b": { params: "7B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [771]
  "model:qwen2-1-5b": { params: "1.5B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [772]
  "model:qwen2-0-5b": { params: "0.5B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [773]
  "model:llama-3-70b": { params: "70B", context: "8K", context_k: 8, license: "Llama 3 Community", license_group: "Permissive Community" },
  // [774]
  "model:mistral-7b-v0-3": { params: "7.3B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [775]
  "model:mathstral-7b": { params: "7B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [776]
  "model:codestral-22b": { params: "22B", context: "32K", context_k: 32, license: "Mistral Non-Production", license_group: "Non-Commercial / Research" },
  // [777]
  "model:deepseek-llm-67b": { params: "67B", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [778]
  "model:deepseek-llm-7b": { params: "7B", context: "4K", context_k: 4, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [779]
  "model:granite-8b-instruct": { params: "8B", context: "128K", context_k: 128, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [780]
  "model:internlm2-20b": { params: "20B", context: "200K", context_k: 200, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [781]
  "model:internlm2-7b": { params: "7B", context: "200K", context_k: 200, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [782]
  "model:yi-6b": { params: "6B", context: "200K", context_k: 200, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [783]
  "model:yi-9b": { params: "9B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [784]
  "model:e5-mistral-7b": { params: "7.1B", context: "32K", context_k: 32, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [821]
  "model:gemini-1-0-pro": { params: null, context: "32K", context_k: 32, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [822]
  "model:gemini-1-0-ultra": { params: null, context: "32K", context_k: 32, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [823]
  "model:claude-2-1": { params: null, context: "200K", context_k: 200, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [824]
  "model:claude-instant-1-2": { params: null, context: "100K", context_k: 100, license: "Proprietary", license_group: "Proprietary / Commercial" },
  // [825]
  "model:qwen-72b": { params: "72B", context: "8K", context_k: 8, license: "Qwen License", license_group: "Permissive Community" },
  // [826]
  "model:qwen-14b": { params: "14B", context: "8K", context_k: 8, license: "Qwen License", license_group: "Permissive Community" },
  // [827]
  "model:qwen-7b": { params: "7B", context: "8K", context_k: 8, license: "Qwen License", license_group: "Permissive Community" },
  // [828]
  "model:qwen1-5-moe": { params: "14.3B MoE (2.7B act)", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [829]
  "model:baichuan2-13b": { params: "13B", context: "4K", context_k: 4, license: "Baichuan Community", license_group: "Permissive Community" },
  // [830]
  "model:baichuan2-7b": { params: "7B", context: "4K", context_k: 4, license: "Baichuan Community", license_group: "Permissive Community" },
  // [831]
  "model:chatglm3-6b": { params: "6B", context: "32K", context_k: 32, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [832]
  "model:glm-4-voice": { params: "9B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [833]
  "model:internvl-2-5-8b": { params: "8B", context: "32K", context_k: 32, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [834]
  "model:deepseek-r1-zero": { params: "671B MoE (37B act)", context: "128K", context_k: 128, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [835]
  "model:deepseek-v2-chat": { params: "236B MoE (21B act)", context: "128K", context_k: 128, license: "DeepSeek Model License", license_group: "Permissive Community" },
  // [881]
  "model:chatglm2-6b": { params: "6B", context: "32K", context_k: 32, license: "ChatGLM License", license_group: "Permissive Community" },
  // [882]
  "model:chatglm-6b": { params: "6.2B", context: "2K", context_k: 2, license: "ChatGLM License", license_group: "Permissive Community" },
  // [883]
  "model:glm-4-9b-chat": { params: "9B", context: "128K", context_k: 128, license: "GLM-4 License", license_group: "Permissive Community" },
  // [884]
  "model:glm-edge-v-5b": { params: "5B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [885]
  "model:glm-edge-1-5b": { params: "1.5B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [886]
  "model:internvl-2-1b": { params: "1B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [887]
  "model:internvl-2-4b": { params: "4B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [888]
  "model:aquila2-34b": { params: "34B", context: "4K", context_k: 4, license: "BAAI Aquila License", license_group: "Permissive Community" },
  // [889]
  "model:minicpm-2-4b": { params: "2.4B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [890]
  "model:telechat-7b": { params: "7B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [940]
  "model:internlm-xcomposer2": { params: "7B", context: "4K", context_k: 4, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [941]
  "model:chatglm-med": { params: "6B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [942]
  "model:falcon-40b": { params: "40B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [943]
  "model:mpt-7b": { params: "7B", context: "65K", context_k: 65, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [944]
  "model:mpt-30b": { params: "30B", context: "8K", context_k: 8, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [945]
  "model:redpajama-incite-7b": { params: "7B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [946]
  "model:pythia-12b": { params: "12B", context: "2K", context_k: 2, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [990]
  "model:octo": { params: "93M", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [991]
  "model:openx-embodiment": { params: "RT-1-X / RT-2-X", context: null, context_k: null, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [992]
  "model:act-robotics": { params: "Visuomotor Policy", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [993]
  "model:diffusion-policy": { params: "Diffusion Policy", context: null, context_k: null, license: "MIT", license_group: "MIT / Apache 2.0" },
  // [994]
  "model:progen2": { params: "764M–6.4B", context: "1K", context_k: 1, license: "BSD-3-Clause", license_group: "MIT / Apache 2.0" },
  // [995]
  "model:evo-dna": { params: "7B", context: "131K", context_k: 131, license: "Apache 2.0", license_group: "MIT / Apache 2.0" },
  // [996]
  "model:hyenadna": { params: "1.4M–42M", context: "1M", context_k: 1000, license: "Apache 2.0", license_group: "MIT / Apache 2.0" }
};

// Check if all 300 models in ai-models.json are covered in specs
let missingCount = 0;
models.forEach(m => {
  if (!specs[m.canonical_id]) {
    console.log('MISSING SPEC FOR:', m.canonical_id, m.name);
    missingCount++;
  }
});

console.log('Total checked:', models.length, 'Missing specs:', missingCount);
module.exports = specs;
