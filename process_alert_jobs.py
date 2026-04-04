from database.session import SessionLocal
from App.services.alert_jobs_service import process_pending_alert_jobs


def main():
    db = SessionLocal()
    try:
        result = process_pending_alert_jobs(db)
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
