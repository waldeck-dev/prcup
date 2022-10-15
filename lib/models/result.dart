class Result {
  late String name;
  late String avatar;
  late int position;
  late int score;

  Result(
      {required this.name,
      required this.avatar,
      required this.position,
      required this.score});

  String getOrdinalPosition() {
    return '$position ${getOrdinalSuffix(position)}';
  }

  String getOrdinalSuffix(number) {
    if (!(number >= 1 && number <= 100)) {
      throw Exception('Invalid number');
    }

    if (number >= 11 && number <= 13) {
      return 'th';
    }

    switch (number % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}
