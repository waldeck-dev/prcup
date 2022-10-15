import 'dart:convert';

import 'package:http/http.dart' as http;

// ignore: avoid_relative_lib_imports
import '../lib/services/save.dart';

class WorkerSaveManager extends SaveManager {
  List<int> getPullsToProcess(int latestPull) {
    final allResults = save['results'];
    List<int> processedPR = [];
    for (final result in allResults) {
      if (result['number'] is int) {
        processedPR.add(result['number']);
      }
    }

    processedPR.sort();

    save['remarkable_numbers'].sort();

    List<int> pullsToProcess = [];
    for (final number in save['remarkable_numbers']) {
      if (number is int &&
          number <= latestPull &&
          !processedPR.contains(number)) {
        pullsToProcess.add(number);
      }
    }

    return pullsToProcess;
  }

  Map<String, dynamic> extractPullData(Map<String, dynamic> pull) {
    final hasNumber = pull.containsKey('number');
    if (!hasNumber) return {};

    final hasUser = pull.containsKey('user');
    if (!hasUser) return {};

    final user = pull['user'];
    final hasLogin = user.containsKey('login');
    final hasAvatar = user.containsKey('avatar_url');
    if (!hasLogin || !hasAvatar) return {};

    return {
      'number': pull['number'],
      'user': user['login'],
      'avatar': user['avatar_url'],
    };
  }

  void processPull(Map<String, dynamic> pull) {
    final pullData = extractPullData(pull);
    if (pullData.isEmpty) return;

    save['results'].add(pullData);
  }

  void persist() async {
    final res = await http.put(
        Uri.https(SaveManager.firebaseUrl, 'results.json',
            {'access_token': creds.accessToken.data}),
        body: jsonEncode(save['results']));

    if (res.statusCode != 200) {
      throw Exception(res.body);
    }
  }
}
