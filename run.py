#!/usr/bin/env python3
"""
Application Layer Protocol Visualizer - Unified Launcher
Run this script to start the application:
    python run.py

Automatically detects environment capabilities:
- If uvicorn + fastapi installed: launches full FastAPI REST server.
- Fallback: launches Python standard library http.server for frontend.
"""
import sys
import os
import webbrowser
from pathlib import Path

PORT = 8000
HOST = "127.0.0.1"
PROJECT_ROOT = Path(__file__).resolve().parent

def main():
    print("=" * 68)
    print("   COMPUTER NETWORKS - APPLICATION LAYER PROTOCOL VISUALIZER")
    print("   Dual-Panel Activity & Protocol Simulator (DNS / HTTP / SMTP / HLS)")
    print("=" * 68)
    
    url = f"http://{HOST}:{PORT}"
    print(f"\n[*] Launching Dashboard at: {url}")

    # Check for FastAPI / Uvicorn
    try:
        import uvicorn
        import fastapi
        print("[+] FastAPI & Uvicorn detected. Starting full backend simulation server...")
        print("[*] Access web dashboard at: http://127.0.0.1:8000")
        print("[*] API interactive docs at: http://127.0.0.1:8000/docs")
        print("[*] Press Ctrl+C to stop the server.\n")
        
        # Open browser in a separate thread/helper
        try:
            webbrowser.open(url)
        except Exception:
            pass

        uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
        return
    except ImportError:
        pass

    # Fallback to standard library HTTP server
    print("[!] FastAPI/Uvicorn not found in this environment.")
    print("[+] Falling back to Python standard library http.server (standalone JS mode)...")
    import http.server
    import socketserver

    frontend_dir = PROJECT_ROOT / "frontend"
    os.chdir(frontend_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
        print(f"[*] Serving frontend on {url}")
        print("[*] Press Ctrl+C to stop the server.\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Server stopped by user.")

if __name__ == "__main__":
    main()
