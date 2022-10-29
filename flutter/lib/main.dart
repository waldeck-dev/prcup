import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:prcup/models/result.dart';

import 'services/save.dart';

import 'widgets/commons.dart';
import 'widgets/user_card.dart';

void main() async {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late Map<String, dynamic> _save;
  List<List<Result>> _rankedResults = [[]];
  int _nextRemarkableNumbers = 0;

  void _loadSave(Map<String, dynamic> newSave) {
    setState(() {
      _save = newSave;
    });
  }

  @override
  void initState() {
    super.initState();

    final saveMgr = SaveManager();
    saveMgr.fetch().then((response) {
      _loadSave(jsonDecode(response.body));
      getRankedResults(_save);
      getNextRemarkableNumber(_save);
    });
  }

  @override
  Widget build(BuildContext context) {
    double vw = MediaQuery.of(context).size.width;
    double vh = MediaQuery.of(context).size.height;
    double offsetH = vh * .2;

    return Material(
      child: Center(
          child: Container(
        height: vh,
        width: vw,
        decoration: const BoxDecoration(color: Color.fromARGB(255, 50, 52, 60)),
        child: SingleChildScrollView(
          scrollDirection: Axis.vertical,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 48.0),
                child: Column(
                  children: [
                    Text(
                      '#PR Cup',
                      style: GoogleFonts.racingSansOne(
                          color: fontColor,
                          fontSize: 64,
                          shadows: [Shadow(color: shadowColor, blurRadius: 8)]),
                    ),
                    Text(
                      "Next target: #${_nextRemarkableNumbers.toString()}",
                      style: GoogleFonts.spaceGrotesk(
                          color: fontColor,
                          fontSize: 16,
                          shadows: [Shadow(color: shadowColor, blurRadius: 8)]),
                    )
                  ],
                ),
              ),
              SizedBox(height: offsetH),
              ..._rankedResults.map(
                (users) => Wrap(
                  alignment: WrapAlignment.center,
                  children: [
                    ...users.map((result) => UserCard(
                        name: result.name,
                        avatar: result.avatar,
                        position: result.position,
                        score: result.score))
                  ],
                ),
              ),
              SizedBox(height: offsetH / 2),
            ],
          ),
        ),
      )),
    );
  }

  void getRankedResults(save) {
    final List<dynamic> results = save['results'];

    final Map<String, dynamic> avatars = {};
    final Map<String, dynamic> scores = {};

    for (var result in results) {
      final user = result['user'];

      if (!avatars.containsKey(user)) {
        avatars[user] = result['avatar'];
      }

      if (scores.containsKey(user)) {
        scores[user] += 1;
      } else {
        scores[user] = 1;
      }
    }

    final int maxScore =
        scores.values.toList(growable: false).reduce((currentMax, value) {
      return (currentMax == null || value > currentMax) ? value : currentMax;
    });

    var currentMaxScore = maxScore;
    var currentPos = 1;
    List<List<Result>> rankedResults = [];

    while (currentMaxScore > 0) {
      final List<Result> currentPosResults = [];
      scores.forEach((name, score) {
        if (score == currentMaxScore) {
          currentPosResults.add(Result(
              name: name,
              avatar: avatars[name],
              position: currentPos,
              score: score));
        }
      });

      if (currentPosResults.isNotEmpty) {
        rankedResults.add(currentPosResults);
      }

      currentMaxScore--;
      currentPos += currentPosResults.length;
    }

    setState(() {
      _rankedResults = rankedResults;
    });
  }

  getNextRemarkableNumber(save) {
    final allNumbers = save['remarkable_numbers']..sort();

    final scoredNumbers = save['results'].map((r) => r['number']).toList()
      ..sort();

    final latestNumber = scoredNumbers.last;
    final latestNumberIndex = allNumbers.indexOf(latestNumber);

    final nextRemarkableNumbers = latestNumberIndex + 1 < allNumbers.length
        ? allNumbers[latestNumberIndex + 1]
        : -1;

    setState(() {
      _nextRemarkableNumbers = nextRemarkableNumbers;
    });
  }
}
