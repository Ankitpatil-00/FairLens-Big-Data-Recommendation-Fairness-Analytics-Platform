import os
import shutil
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def ensure_java_home():
    current = os.environ.get("JAVA_HOME")
    if current and os.path.exists(os.path.join(current, "bin", "java.exe" if sys.platform == "win32" else "java")):
        return current
    candidates = []
    if sys.platform == "win32":
        for base in [r"C:\Program Files\Java", r"C:\Program Files (x86)\Java"]:
            if os.path.exists(base):
                for entry in sorted(os.listdir(base), reverse=True):
                    cand = os.path.join(base, entry)
                    if os.path.exists(os.path.join(cand, "bin", "java.exe")):
                        candidates.append(cand)
        java_exe = shutil.which("java")
        if java_exe:
            parent = os.path.dirname(os.path.dirname(java_exe))
            if os.path.exists(os.path.join(parent, "bin", "java.exe")):
                candidates.append(parent)
    for cand in candidates:
        if os.path.exists(cand):
            os.environ["JAVA_HOME"] = cand
            return cand
    return None

def get_python_exe():
    # Auto-detect virtual environment Python
    candidates = [
        ROOT / "venv" / "Scripts" / "python.exe",
        ROOT / ".venv" / "Scripts" / "python.exe",
        ROOT / "venv" / "bin" / "python",
        ROOT / ".venv" / "bin" / "python",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return sys.executable

def main():
    ensure_java_home()
    print("=" * 60)
    print("Starting FairLens Recommendation Analytics Platform...")
    print("=" * 60)

    python_exe = get_python_exe()
    backend_script = ROOT / "backend" / "server.py"
    frontend_dir = ROOT / "frontend"

    print(f"Using Python: {python_exe}")

    # Start Backend API (inherit console stdout so it never buffers or hangs)
    print("\n[1/2] Starting Python REST API Backend on http://localhost:8000...")
    backend_proc = subprocess.Popen(
        [python_exe, "-u", str(backend_script)],
        cwd=str(ROOT / "backend"),
        stdout=None,
        stderr=None
    )

    # Wait for backend to be ready
    time.sleep(2)

    # Start Vite Frontend
    print("[2/2] Starting Vite React Frontend on http://localhost:5173...")
    frontend_cmd = "npm run dev" if sys.platform != "win32" else "npm.cmd run dev"
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(frontend_dir),
        shell=True,
        stdout=None,
        stderr=None
    )

    time.sleep(2)
    ui_url = "http://localhost:5173"
    print("\n" + "=" * 60)
    print(f"FairLens UI is running at: {ui_url}")
    print("Backend API is running at: http://localhost:8000")
    print("Press Ctrl+C in this terminal to stop both servers.")
    print("=" * 60 + "\n")

    try:
        webbrowser.open(ui_url)
    except Exception:
        pass

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("Backend process ended.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend process ended.")
                break
    except KeyboardInterrupt:
        print("\nStopping FairLens servers...")
    finally:
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
        except Exception:
            pass
        print("FairLens shutdown complete.")

if __name__ == "__main__":
    main()
