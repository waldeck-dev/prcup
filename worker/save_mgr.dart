import 'dart:convert';
import "dart:io";

class SaveManager {
  String path;
  late Map<String, dynamic> save;

  SaveManager(this.path) {
    getOrCreateFile();
    save = read();
  }

  File getOrCreateFile() {
    final file = File(path);

    if (!file.existsSync()) {
      file.createSync(recursive: true);
      writeToFile(jsonEncode({'remarkable_numbers': [], 'results': []}));
      return getOrCreateFile();
    }

    return file;
  }

  void writeToFile(content) {
    final file = File(path);
    if (file.existsSync()) {
      file.writeAsStringSync(content);
    }
  }

  void persistToFile() {
    writeToFile(jsonEncode(save));
  }

  Map<String, dynamic> read() {
    final content = getOrCreateFile().readAsStringSync();
    return jsonDecode(content);
  }

  Map<String, dynamic> initEmptySave() {
    return {'remarkable_numbers': [], 'results': []};
  }

  List<dynamic> getListFromSave(String key) {
    dynamic list;
    try {
      list = save[key];
    } on FormatException {
      return [];
    }

    if (list.isNotEmpty) {
      return list;
    } else {
      return [];
    }
  }

  List<int> getPullsToProcess(int latestPull) {
    final allResults = getListFromSave('results');
    List<int> processedPR = [];
    for (final result in allResults) {
      if (result['number'] is int) {
        processedPR.add(result['number']);
      }
    }

    processedPR.sort();

    final remarkableNumbers = getListFromSave('remarkable_numbers');
    remarkableNumbers.sort();

    List<int> pullsToProcess = [];
    for (final number in remarkableNumbers) {
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

    persistToFile();
  }
}
