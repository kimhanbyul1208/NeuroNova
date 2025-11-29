"""
Django management command to load dummy data from SQL file.
Usage: python manage.py load_dummy_data
"""
from django.core.management.base import BaseCommand
from django.db import connection
from pathlib import Path
import os


class Command(BaseCommand):
    help = 'Load dummy data from SQL file into database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='dummy_data.sql',
            help='SQL file name (default: dummy_data.sql)'
        )

    def handle(self, *args, **options):
        sql_file = options['file']
        # Get the project root directory (where manage.py is located)
        # Using pathlib for cleaner code
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        file_path = base_dir / sql_file

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'SQL file not found: {file_path}'))
            return

        self.stdout.write(self.style.WARNING(f'Loading dummy data from: {file_path}'))

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()

            # Split by semicolon and execute each statement
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]

            with connection.cursor() as cursor:
                for i, statement in enumerate(statements, 1):
                    # Skip comments and empty statements
                    if statement.startswith('--') or not statement:
                        continue

                    try:
                        cursor.execute(statement)
                        if i % 10 == 0:
                            self.stdout.write(f'  Executed {i}/{len(statements)} statements...')
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'  Warning at statement {i}: {str(e)[:100]}')
                        )
                        continue

            self.stdout.write(self.style.SUCCESS('✓ Dummy data loaded successfully!'))
            self.stdout.write(self.style.SUCCESS(f'  Total statements executed: {len(statements)}'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading dummy data: {str(e)}'))
            raise
