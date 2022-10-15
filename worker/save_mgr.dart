import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:googleapis_auth/auth_io.dart';

class SaveManager {
  static const firebaseUrl = String.fromEnvironment('FIREBASE_URL');

  final Map<String, dynamic> save = {};

  late Map<String, dynamic> credentialsJson;
  late AccessCredentials creds;

  SaveManager(credentialsPath) {
    credentialsJson = getCredentials(credentialsPath);
  }

  Map<String, dynamic> getCredentials(path) {
    const rawCreds = String.fromEnvironment('FIREBASE_SA_CREDS');
    final decodedCreds = base64.decode(base64.normalize(rawCreds));
    return jsonDecode(utf8.decode(decodedCreds));
  }

  Future<AccessCredentials> obtainCredentials(credentialsJson) async {
    final accountCredentials =
        ServiceAccountCredentials.fromJson(credentialsJson);
    var scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/firebase.database"
    ];

    var client = http.Client();
    AccessCredentials credentials =
        await obtainAccessCredentialsViaServiceAccount(
            accountCredentials, scopes, client);

    client.close();
    return credentials;
  }

  dynamic parseResponse(http.Response response, dynamic defaultValue) {
    if (response.statusCode == 200) {
      return jsonDecode(response.body) ?? defaultValue;
    } else {
      throw Exception(response.body);
    }
  }

  init() async {
    creds = await obtainCredentials(credentialsJson);
    if (creds.runtimeType != AccessCredentials) {
      throw Exception("There was an error during authentication");
    }

    final resRemarkableNumbers = await http.get(Uri.https(firebaseUrl,
        'remarkable_numbers.json', {'access_token': creds.accessToken.data}));
    save['remarkable_numbers'] = parseResponse(resRemarkableNumbers, []);

    final resResults = await http.get(Uri.https(
        firebaseUrl, 'results.json', {'access_token': creds.accessToken.data}));
    save['results'] = parseResponse(resResults, []);
  }

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
        Uri.https(firebaseUrl, 'results.json',
            {'access_token': creds.accessToken.data}),
        body: jsonEncode(save['results']));

    if (res.statusCode != 200) {
      throw Exception(res.body);
    }
  }
}
