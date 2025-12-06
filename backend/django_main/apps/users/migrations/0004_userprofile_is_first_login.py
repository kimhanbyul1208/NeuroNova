# Generated migration file for adding is_first_login field to UserProfile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_department_created_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='is_first_login',
            field=models.BooleanField(default=True, help_text='True면 비밀번호 변경 필수', verbose_name='최초 로그인 여부'),
        ),
    ]
