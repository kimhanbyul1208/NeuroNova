# Generated migration file for adding ssn_encrypted and medical_record_number fields to Patient

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('emr', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='ssn_encrypted',
            field=models.BinaryField(blank=True, help_text='Fernet 암호화된 주민등록번호', null=True, verbose_name='주민등록번호 (암호화)'),
        ),
        migrations.AddField(
            model_name='patient',
            name='medical_record_number',
            field=models.CharField(blank=True, help_text='간호사 등록 시 발급되는 병원 등록번호 (예: MR-20250101-0001)', max_length=50, null=True, unique=True, verbose_name='진료기록번호'),
        ),
    ]
