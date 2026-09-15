import os
import uuid
from dotenv import load_dotenv
from fastapi import UploadFile
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

class StorageService:
    def __init__(self):
        try:
            if SUPABASE_URL and SUPABASE_KEY:
                self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("[StorageService] Connected to Supabase Storage.")
            else:
                self.client = None
                print("[StorageService] Missing Supabase credentials in .env. Falling back to local.")
        except Exception as e:
            print(f"[StorageService] Supabase init failed: {e}. Using local fallback.")
            self.client = None

    def upload_file(self, file: UploadFile, folder: str = "submissions") -> str:
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        storage_path = f"{folder}/{unique_filename}"

        if self.client:
            try:
                file.file.seek(0)
                file_bytes = file.file.read()
                
                # Upload bytes directly to the 'submissions' bucket
                self.client.storage.from_("submissions").upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": file.content_type or "application/octet-stream"}
                )
                return self.client.storage.from_("submissions").get_public_url(storage_path)
            except Exception as e:
                print(f"[StorageService] Supabase upload failed with error: {e}. Falling back to local.")

        # Local fallback
        os.makedirs(f"uploads/{folder}", exist_ok=True)
        local_path = f"uploads/{folder}/{unique_filename}"
        file.file.seek(0)
        with open(local_path, "wb") as buffer:
            buffer.write(file.file.read())
        return f"/local-storage/{local_path}"

storage_service = StorageService()