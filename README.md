# #PR Cup

**#PR Cup** is a simple application to gamify Github's Pull Request (PR) management within a team of developers.

The rules are very simple:

- The team establishes a list of remarkable numbers
- The developer who creates the PR with this number wins a point

The application compiles the results and ranks the developers according to their score.

**Disclaimer**: The objective of this project is solely to allow me to experiment a few technologies, without any other form of ambition.

## Technical stack

The technical stack is made up as follows:

- **[Database](#database)**: all data is stored using [Firebase Realtime Database](https://firebase.google.com/products/realtime-database)
- **[Worker](#worker)**: PRs-related data is gathered by a worker, made with [Dart](https://dart.dev), running periodically
- **[API](#api)**: very basic API serving data to front-end app, made with [Dart](https://dart.dev) and [shelf](https://pub.dev/packages/shelf)
- **[Web app](#web-app)**: web application (not mobile) made with [Flutter web](https://flutter.dev/multi-platform/web)

---

## Installation

### Environment variables

*TODO ...*

| Env variable | Details |
| --- | --- |
| `FIREBASE_SA_CREDS` | must be a base64 representation of your Service Account credentials (a JSON file) |

### Database

*TODO ...*
### Worker

1. Install dependencies
```sh
cd ./backend
dart pub get
```

2. Run dart script with env variables
```sh
dart run \
    --define=GH_OWNER=<Change me> \
    --define=GH_REPO=<Change me> \
    --define=GH_TOKEN=<Change me> \
    --define=FIREBASE_URL=<Change me> \
    --define=FIREBASE_SA_CREDS=<Change me> \
    ./lib/worker/worker.dart
```

### API

1. Compile API to executable
```
cd ./backend
dart pub get
dart compile exe ./backend/lib/api/main.dart -o /tmp/prcup-api
```

2. Make sure environment variables `FIREBASE_URL` and `FIREBASE_SA_CREDS` are set

3. You may now run `prcup-api`, located at `/tmp/`

### Web app

*TODO ...*
