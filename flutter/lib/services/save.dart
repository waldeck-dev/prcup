import 'package:http/http.dart' as http;

class SaveManager {
  static const baseUrl = 'prcup.datalumni.com';
  static const savesEndpoint = '/prcup-api/saves';

  SaveManager();

  Future<http.Response> fetch() {
    return http.get(Uri.http(baseUrl, savesEndpoint));
  }
}
