import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:googleapis_auth/auth_io.dart';

class SaveManager {
  static const firebaseUrl = String.fromEnvironment('FIREBASE_URL');

  final Map<String, dynamic> save = {};

  late Map<String, dynamic> credentialsJson;
  late AccessCredentials creds;

  SaveManager() {
    credentialsJson = getCredentials();
  }

  Map<String, dynamic> getCredentials() {
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

  Future<Map<String, dynamic>> init() async {
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

    return save;
  }
}
