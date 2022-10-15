import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'commons.dart';

class UserCard extends StatelessWidget {
  const UserCard(
      {super.key,
      required this.name,
      required this.avatar,
      required this.position,
      required this.score});

  final String name;
  final String avatar;
  final int position;
  final int score;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Container(
            width: getSize(),
            height: getSize(),
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white12, width: 3.0),
                boxShadow: const [
                  BoxShadow(blurRadius: 10.0, color: Colors.black54)
                ],
                image: DecorationImage(
                    image: NetworkImage(avatar), fit: BoxFit.cover)),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Tooltip(
              message:
                  '${getOrdinalPosition()} place\n$score PR${score > 1 ? "s" : ""}',
              textAlign: TextAlign.center,
              child: Text(
                getEmoji(position),
                style: TextStyle(color: fontColor, fontSize: getSize() / 4),
              ),
            ),
          ),
          Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(name,
                  style: GoogleFonts.spaceGrotesk(
                      color: fontColor, fontSize: getSize() / 10))),
        ],
      ),
    );
  }

  double getSize() {
    return position == 1 ? 150 : 100;
  }

  String getEmoji(position) {
    switch (position) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
    }

    return "▫️";
  }

  String getOrdinalPosition() {
    return '$position${getOrdinalSuffix(position)}';
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
