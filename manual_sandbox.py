import os
import time
import sys
import json
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
import base64
# Load .env file manually if it exists to avoid pip install issues
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]

def robust_generate_content(client, contents, config=None):
    """Executes a generation request with exponential backoff and automatic model fallback on 503s."""
    max_retries_per_model = 3
    base_delay = 2
    
    for model_name in FALLBACK_MODELS:
        for attempt in range(max_retries_per_model):
            try:
                if attempt > 0 or model_name != FALLBACK_MODELS[0]:
                    print(f"    [~] Attempting generation with model: {model_name} (Attempt {attempt + 1})")
                
                return client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
            except Exception as e:
                if "503" in str(e):
                    if attempt < max_retries_per_model - 1:
                        sleep_time = base_delay ** attempt
                        print(f"    [!] Server 503 for {model_name}. Retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                    else:
                        print(f"    [!] Model {model_name} exhausted retries. Falling back to next available model...")
                        break # Break the retry loop and try the next model in FALLBACK_MODELS
                else:
                    raise e
    raise Exception("All fallback models exhausted due to persistent 503 High Demand.")

# =====================================================================
# MILESTONE 1: DEFINE STRUCTURAL OUTPUT SCHEMA CONTRACT
# =====================================================================
class FinancialSummary(BaseModel):
    burn_rate: str = Field(description="Monthly net burn rate.")
    runway: str = Field(description="Remaining cash runway (e.g. in months).")
    total_debt: str = Field(description="Total outstanding debt or liabilities.")

class AcquisitionAuditReport(BaseModel):
    target_company: str = Field(description="Name of the target startup entity being audited.")
    compliant: bool = Field(description="True if target breaches zero corporate policies; False otherwise.")
    identified_risks: list[str] = Field(description="Bullet list detailing explicit structural or financial mismatches.")
    financial_summary: FinancialSummary = Field(description="Key parsed financial parameters.")

# =====================================================================
# STATE LOGIC: STATE FILE STORAGE LIFECYCLE MANAGEMENT
# =====================================================================
STATE_FILE = "agent_session_state.json"

def safe_encoder(obj):
    """Custom encoder to serialize bytes and custom model classes to JSON safely."""
    if isinstance(obj, bytes):
        return base64.b64encode(obj).decode('utf-8')
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    return str(obj)

def save_session_history(history_data: list):
    """Milestone 2: Persists execution records directly to disk."""
    try:
        serialized = json.loads(json.dumps(history_data, default=safe_encoder))
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2)
        print("[*] Session history safely serialized and persisted to state file.")
    except Exception as e:
        print(f"[-] Failed to persist session history: {e}")

def load_session_history() -> list:
    """Milestone 2: Restores baseline execution matrix from disk if present."""
    if os.path.exists(STATE_FILE):
        print("[+] Existing state snapshot detected. Resuming session context...")
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[-] Failed to load session history: {e}")
    return []

# =====================================================================
# PIPELINE SETUP: CORE STORAGE ENGINE PROVISIONING
# =====================================================================
def initialize_rag_stores(client):
    print("[*] Provisioning isolated Financial RAG Repository...")
    fin_store = client.file_search_stores.create(
        config={"display_name": "fin_index", "embedding_model": "models/gemini-embedding-2"}
    )
    op_fin = client.file_search_stores.upload_to_file_search_store(
        file_search_store_name=fin_store.name, file="startup_finances.txt"
    )

    print("[*] Provisioning isolated Legal Corporate Policy Repository...")
    legal_store = client.file_search_stores.create(
        config={"display_name": "legal_index", "embedding_model": "models/gemini-embedding-2"}
    )
    op_legal = client.file_search_stores.upload_to_file_search_store(
        file_search_store_name=legal_store.name, file="buyer_policies.txt"
    )

    while not (op_fin.done and op_legal.done):
        print("    [..] Indexing decoupled vector layers...")
        time.sleep(3)
        op_fin = client.operations.get(op_fin)
        op_legal = client.operations.get(op_legal)
        
    print("[+] RAG indices are live.\n")
    return fin_store.name, legal_store.name

# =====================================================================
# CORE MANUAL EXECUTOR PIPELINE
# =====================================================================
def run_manual_agent_orchestrator():
    if "GEMINI_API_KEY" not in os.environ:
        print("[-] Error: GEMINI_API_KEY environment variable missing.")
        sys.exit(1)

    client = genai.Client()
    fin_id, legal_id = initialize_rag_stores(client)
    
    # Initialize history array
    conversation_history = load_session_history()
    
    if not conversation_history:
        initial_user_prompt = (
            "Execute a comprehensive M&A evaluation. Verify if AlphaTech Robotics "
            "violates any target parameters or ceilings defined in our corporate buying policy."
        )
        conversation_history.append({"role": "user", "parts": [{"text": initial_user_prompt}]})
    
    def exec_financial_query(query: str) -> str:
        return robust_generate_content(
            client=client,
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction="Extract explicit financial values, debt amounts, and burn rates from the store.",
                tools=[{"file_search": {"file_search_store_names": [fin_id]}}]
            )
        ).text

    def exec_legal_query(query: str) -> str:
        return robust_generate_content(
            client=client,
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction="Extract explicit corporate policy limits, ceilings, and rules from the store.",
                tools=[{"file_search": {"file_search_store_names": [legal_id]}}]
            )
        ).text

    # Formal function schemas configuration
    tool_declarations = [
        types.FunctionDeclaration(
            name="query_financial_database",
            description="Queries the target company's current balance sheets, burn rates, runway, and financial metrics.",
            parameters=types.Schema(
                type="OBJECT",
                properties={"sub_query": types.Schema(type="STRING", description="Specific metric to look up.")},
                required=["sub_query"]
            )
        ),
        types.FunctionDeclaration(
            name="query_corporate_policies",
            description="Queries the buying entity's acquisition guidelines, risk rules, and restrictions.",
            parameters=types.Schema(
                type="OBJECT",
                properties={"sub_query": types.Schema(type="STRING", description="Rule check criteria parameter.")},
                required=["sub_query"]
            )
        )
    ]

    print("[*] Launching execution loop...")
    loop_active = True
    max_turns = 5
    turn_count = 0

    while loop_active and turn_count < max_turns:
        turn_count += 1
        print(f"\n--- Execution Cycle Turn {turn_count} ---")
        
        # Normalize execution parameters to raw dictionaries to bypass type mixing collisions
        normalized_contents = json.loads(json.dumps(conversation_history, default=safe_encoder))

        response = robust_generate_content(
            client=client,
            contents=normalized_contents,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are the Lead M&A Orchestrator. You are completely blind to raw data inputs. "
                    "You must use your available tools to check targets and cross-reference them. "
                    "Once you have gathered all metrics from both tools, stop calling tools and wait for final synthesis."
                ),
                tools=[types.Tool(function_declarations=tool_declarations)]
            )
        )
        
        # Save the structured model response content directly 
        model_turn = response.candidates[0].content
        conversation_history.append(model_turn)
        
        # Modern SDK handles function extraction directly off the top level response layout
        if response.function_calls:
            print(f"[!] Coordinator requested tool execution: {[fc.name for fc in response.function_calls]}")
            tool_response_parts = []
            
            for call in response.function_calls:
                if call.name == "query_financial_database":
                    result_str = exec_financial_query(call.args["sub_query"])
                    
                    # NEW: Prevent infinite loop on empty or failed RAG responses
                    if not result_str or result_str.strip() == "":
                        result_str = "ERROR: Financial database query returned empty context. Server high demand or target data missing."
                    
                    tool_response_parts.append(
                        types.Part(
                            function_response=types.FunctionResponse(
                                name=call.name,
                                response={"result": result_str}
                            )
                        )
                    )
                elif call.name == "query_corporate_policies":
                    result_str = exec_legal_query(call.args["sub_query"])
                    
                    # NEW: Prevent infinite loop on empty or failed RAG responses
                    if not result_str or result_str.strip() == "":
                        result_str = "ERROR: Corporate policy query returned empty context. Server high demand or target data missing."
                        
                    tool_response_parts.append(
                        types.Part(
                            function_response=types.FunctionResponse(
                                name=call.name,
                                response={"result": result_str}
                            )
                        )
                    )
            
            # Map execution values array back to history payload. Note: role must be 'user' for function response.
            conversation_history.append(types.Content(role="user", parts=tool_response_parts))
            save_session_history(conversation_history)
        else:
            print("[+] Info accumulation complete. Proceeding to structural synthesis.")
            loop_active = False

    # =====================================================================
    # FINAL PHASE: INVOKE STRUCTURED SYNTHESIS AGENT (MILESTONE 1)
    # =====================================================================
    print("\n[*] Invoking Synthesis layer to construct structured output payload...")
    
    normalized_final_contents = json.loads(json.dumps(conversation_history, default=safe_encoder))

    final_response = robust_generate_content(
        client=client,
        contents=normalized_final_contents,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a strict compliance auditor. Read the gathered tool reports. "
                "Locate the target's outstanding debt (or convertible notes) and the corporate policy debt limit from the tool outputs. "
                "Mathematically compare these exact values. If the target's outstanding debt exceeds the corporate policy limit, "
                "you MUST mark compliant as false and detail the numeric variance in identified_risks."
            ),
            response_mime_type="application/json",
            response_schema=AcquisitionAuditReport,
        )
    )

    print("\n" + "="*70)
    print("FINAL VALIDATED JSON M&A COMPLIANCE REPORT:")
    print("="*70)
    print(final_response.text)
    
 # =====================================================================
    # OPERATIONAL CLEANUP
    # =====================================================================
    print("\n[*] Purging ephemeral vector assets from cloud registry...")
    
    try:
        client.file_search_stores.delete(name=fin_id, config={"force": True})
        client.file_search_stores.delete(name=legal_id, config={"force": True})
        print("[+] RAG databases successfully purged.")
    except Exception as cleanup_error:
        print(f"[-] Operational alert during background registry cleanup: {cleanup_error}")

    # Remove local state snapshot files to ensure fresh data schemas on subsequent runs
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
        
    print("[+] Workspace cleanly purged and reset.")

if __name__ == "__main__":
    run_manual_agent_orchestrator()