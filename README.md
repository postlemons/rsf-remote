# Duplicate Checker - Express Version
The code has been re-written in JS

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)
- Google API Token [Service account]

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/postlemons/rsf-remote.git
    cd rsf-remote/express-version
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

### Configuration

To use the Google API, you need to obtain a token from the Google Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to the "APIs & Services" section and enable the necessary APIs (e.g., Google Sheets API).
4. Create credentials and obtain an OAuth 2.0 Client ID.
5. Download the credentials JSON file and save it in the `express-version` folder.
6. Rename the file to `token.json`.

### Running the Application

To start the application, run:

```sh
npm start
```

## Usage

Provide instructions on how to use the application.

## Contributing

If you would like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
```
