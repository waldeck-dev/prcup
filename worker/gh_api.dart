import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;

class GithubApi {
  String owner;
  String repository;
  String token;

  GithubApi(this.owner, this.repository, this.token);

  Uri getBaseEndpoint(
      {String extraPath = '', Map<String, String> query = const {}}) {
    final extra = extraPath == '' ? '' : '/$extraPath';
    return Uri.https('api.github.com', 'repos/$owner/$repository$extra', query);
  }

  Map<String, String> getHeaders() {
    return {
      HttpHeaders.acceptHeader: 'application/vnd.github+json',
      HttpHeaders.authorizationHeader: 'Bearer $token'
    };
  }

  dynamic parseResponse(http.Response response) {
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(response.body);
    }
  }

  Future<int> getLatestPull() async {
    final endpoint = getBaseEndpoint(
        extraPath: 'pulls',
        query: {'sort': 'created', 'direction': 'desc', 'per_page': '1'});

    final res = await http.get(endpoint, headers: getHeaders());

    final latestPulls = parseResponse(res) as List<dynamic>;
    final latestPull = latestPulls[0];

    return latestPull['number'];
  }

  Future<Map<String, dynamic>> getPull(int number) async {
    final endpoint = getBaseEndpoint(extraPath: 'pulls/$number');

    final res = await http.get(endpoint, headers: getHeaders());

    return parseResponse(res);
  }
}
