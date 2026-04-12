Objectif de l'application: créer des tournées d'accompagnement à réaliser par des chauffeurs (une par chauffeur) du lundi au dimanche selon plusieurs contraintes.

Usage idéal: l'utilisateur rentre un tableau excel dans l'application qui liste tous les accompagnements à réaliser. L'application génère une proposition de tournée optimisée des chauffeurs selon des contraintes métiers et logistiques préalablement définie. L'utilisateur peut ajustement le planning selon des contraintes spécifiques ponctuelle (exemple: évènement en cours dans la ville qui rend la circulation difficile) ou des nouvelles priorités. L'utilisateur peut pouvoir changer manuellement les délais proposés par l'application et l'ordre des points de passage. L'utilisateur peut aussi annuler certains points de passage et demander une nouvelle génération de tournée correspondante.
Lorsque l'utilisateur confirme la tournée, l'application génère un fichier excel selon un format prédéfini. Un exemple sera fourni.
L'utilisateur peut également soumettre un fichier de tournée généré précédemment afin de pouvoir apporter des modifications (exemple: supprimer un point de passage).

Les accompagnements sont associés à une "mission", elle-même définie par un type (accompagnement ou récupération), une adresse et des informations complémentaires. Exemple: "accompagnement scolaire collège Emile ROUX".
La tournée démarre et se termine toujorus au 117 avenue Simone Veil, 06200 Nice.

Les contraintes métier de tournées sont:
- nombre de chauffeurs et leur disponibilité: cela se traduit par une plage horaire pour ce chauffeur
- nombre de points de passage à réaliser. Les points de passage peuvent être appelés "villa" ou "lieu de rendez-vous"
- la priorité des points de passage peut être variable selon:
    a) spécificité de la personnes prises en charge
    b) la distance d'un point a à un point b (plus longue distance priorisée)
    c) manque d'effectif dans certains sites
    d) une villa avec peu de demande est priorisée selon le type d'accompagnement
- une tournée peut être composée d'une partie facultative si le chauffeur accepte de dépasser sa plage horaire

Les types d'accompagnement sont:
    - scolaire
    - médical
    - loisir: jamais prioritaires
    - famille

L'application permet de créer et sauvegarder une liste de points de passages. Chaque point a les attributs suivants:
    - Nom
    - adresse
    - difficulté pour se garer
    - définir si "villa" ou "lieu de rendez-vous"
    - si une adresse n'est pas reconnu dans "mission", alors l'application doit le signaler et permettre de créer un nouveau point de passage

Contraintes logistiques:
    - prendre en compte le temps de trajet. Typiquement via google maps
    - le temps de trajet est abondé d'une durée de 20min si la destination contient "difficulté pour se garer". cela doit apparaitre séparemment pour chaque segment de la tournée (x min de trajet et "+ 20min pour stationnement difficile")   
    - Si la mission contient le mot clef "Accompagnement", alors rajouter 10min si le point de départ est une villa. (dans l'exemple fourni le mot clef n'est pas encore systématiquement présent, mais ce sera le cas)
    - Quand dans la mission il y a écrit accompagnement, le chauffeur doit aller d'abord à la villa puis accomplir sa mission. Quand dans la mission il y a écrit récupération ou raccompagnement, le chauffeur doit d'abord aller à sa mission puis sur la villa. Il peut y avoir les deux mots dans la même cellule "mission".
    - Il y a deux véhicules et trois chauffeurs. Un chauffeur du matin: 7h à 14h, mais parfois 6h30 à 14h. Un chauffeur de l'après-midi 15h-23h. Le troisième chauffeur fait 7h à 15h mais parfois 7h à 17h30. Lors des vacances scolaires les horaires peuvent changer. les horaires des chauffeurs pour chaque semaine sont indiquées dans le fichier excel soumis par l'utilisateur.

Contraintes techniques:
- Dans la mesure du possible, l'application serait hébergée sur vercel si possible. Si besoin d'une base de donnée, utiliser supabase.
- l'accès doit être sécurisée avec identifiants
- s'assurer de toujours utiliser les dernières versions stables pour la stack technique
