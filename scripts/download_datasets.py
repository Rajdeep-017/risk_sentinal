import os
import subprocess
import zipfile
import httpx
from pathlib import Path
from rich.console import Console
from rich.progress import Progress

console = Console()
BASE_DIR = Path("d:/Razorpay project")
DATA_DIR = BASE_DIR / "data"

DATASETS = {
    "credit": {"type": "kaggle", "id": "uciml/default-of-credit-card-clients-dataset", "dest": DATA_DIR / "raw" / "credit"},
    "cyber": {"type": "kaggle", "id": "mrwellsdavid/unsw-nb15", "dest": DATA_DIR / "raw" / "cyber"},
    "fraud": {"type": "kaggle", "id": "mlg-ulb/creditcardfraud", "dest": DATA_DIR / "raw" / "fraud"},
    "churn": {"type": "url", "url": "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv", "dest": DATA_DIR / "raw" / "churn"}
}

def extract_zip(zip_path: Path, extract_to: Path):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

def download_kaggle(dataset_id: str, dest_dir: Path):
    dest_dir.mkdir(parents=True, exist_ok=True)
    try:
        console.print(f"Downloading Kaggle dataset {dataset_id}...")
        subprocess.run(["kaggle", "datasets", "download", "-d", dataset_id, "-p", str(dest_dir)], check=True)
        # Find zip file and extract
        for file in dest_dir.iterdir():
            if file.suffix == '.zip':
                console.print(f"Extracting {file.name}...")
                extract_zip(file, dest_dir)
                file.unlink() # Delete zip after extraction
    except subprocess.CalledProcessError as e:
        console.print(f"[red]Error downloading from Kaggle: {e}. Ensure Kaggle API is configured.[/red]")
    except FileNotFoundError:
        console.print("[red]Kaggle CLI not found. Please install kaggle library and configure API.[/red]")

def download_url(url: str, dest_dir: Path):
    dest_dir.mkdir(parents=True, exist_ok=True)
    file_name = url.split('/')[-1]
    dest_path = dest_dir / file_name
    
    with httpx.Client() as client:
        with client.stream("GET", url) as response:
            response.raise_for_status()
            total = int(response.headers.get("content-length", 0))
            
            with Progress() as progress:
                task = progress.add_task(f"[cyan]Downloading {file_name}...", total=total)
                with open(dest_path, "wb") as f:
                    for chunk in response.iter_bytes():
                        f.write(chunk)
                        progress.update(task, advance=len(chunk))

def main():
    console.print("[bold green]Starting Data Download Process...[/bold green]")
    for name, info in DATASETS.items():
        if info["type"] == "kaggle":
            download_kaggle(info["id"], info["dest"])
        elif info["type"] == "url":
            download_url(info["url"], info["dest"])
            
    console.print("[bold green]Download complete.[/bold green]")

if __name__ == "__main__":
    main()
