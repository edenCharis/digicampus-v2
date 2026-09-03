from django.db import migrations, models


def daarhspe_to_personnel(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='daarhspe').update(role='personnel')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_abonnement_activitylog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('administrateur', 'Administrateur'),
                    ('scolarité', 'Scolarité'),
                    ('doyen', 'Doyen'),
                    ('enseignant', 'Enseignant'),
                    ('professeur', 'Professeur'),
                    ('cours', 'Cours'),
                    ('inscription', 'Inscription'),
                    ('anonymat', 'Anonymat'),
                    ('personnel', 'Personnel'),
                    ('gesnote', 'Gestion des Notes'),
                    ('soutenance', 'Soutenance'),
                    ('suivi', 'Suivi'),
                    ('caisse', 'Caisse'),
                    ('pvd', 'PVD'),
                ],
                default='scolarité',
                max_length=30,
            ),
        ),
        migrations.RunPython(daarhspe_to_personnel, migrations.RunPython.noop),
    ]
