import * as React from 'react';
import '../Less/app.less';
import * as ProfilePicture from '../Assets/profile.png';

interface AppStates {
  snapshots?: any[];
  newSnapshotName: string
  selectedFile: File;
}
export default class App extends React.Component<{}, AppStates> {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  state: AppStates = {
    snapshots: null,
    newSnapshotName: null,
    selectedFile: null
  };

  componentWillMount = () => {
    console.log('willmount');
    this.getSnapshots();
  }

  getSnapshots = () => {
    fetch('/api/list-snapshots')
      .then(res => res.json())
      .then(res => this.setState({ snapshots: res }));
  }

  restoreSnapshot = (name) => {
    fetch('/api/restore-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name })
    })
      .then(res => res.json()).then(res => alert(res)).then(() => this.getSnapshots());
  }

  removeSnapshot = (name) => {
    fetch('/api/remove-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name })
    })
      .then(res => res.json()).then(() => this.getSnapshots());
  }

  createSnapshot(dataset, name) {
    fetch('/api/create-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ dataset, name })
    })
      .then(res => res.json()).then(() => this.getSnapshots());
  }

  linkRef: any = React.createRef();
  downloadSnapshot(name, reference) {
    fetch('/api/download-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name, reference })
    }).then(res => {
      return res.blob();
    }).then(blob => {
      const href = window.URL.createObjectURL(blob);
      const a = this.linkRef.current;
      a.download = `snapshot_${name}`;
      a.href = href;
      a.click();
      a.href = '';
    }).catch(err => console.error(err));
  }

  uploadSnapshot(data) {
    for (var key of data.entries()) {
      console.log(key[0] + ', ' + key[1]);
    }
    fetch('/api/upload-snapshot', {
      method: 'POST',
      body: data
    }).then(() => this.getSnapshots());
  }

  generateRows(snapshots) {
    const rows = [];
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      rows.push(<tr>
        {
          Object.values(snapshot).map((value) => <td>{value}</td>)
        }
        <td><button onClick={() => this.removeSnapshot(snapshot['name'])}>Delete</button></td>
        {i === snapshots.length - 1 ?
          <td><button onClick={() => this.restoreSnapshot(snapshot['name'])}>Restore</button></td>
          :
          <td></td>
        }
        <td><a ref={this.linkRef} /><button onClick={() => this.downloadSnapshot(snapshot['name'], snapshots[i - 1] ? snapshots[i - 1]['name'] : undefined)}>Download</button></td>
      </tr>);
    }

    return rows;
  }

  handleChange({ target }) {
    this.setState({
      newSnapshotName: target.value
    });
  }

  onChangeHandler = event => {
    console.log(event.target.files);
    this.setState({
      selectedFile: event.target.files[0],
      //loaded: 0,
    })
  }

  onClickHandler = () => {
    const data = new FormData()
    data.append('file', this.state.selectedFile);
    for (var key of (data as any).entries()) {
      console.log(key[0] + ', ' + key[1]);
    }
    this.uploadSnapshot(data);
  }

  render() {
    const { snapshots, newSnapshotName } = this.state;
    return (
      <div>
        <div>
          {snapshots != null ?

            <>
              <span>List of ZFS snapshots</span>
              <table>
                <tr>
                  {Object.keys(snapshots[0]).map((o) =>
                    <th>{o}</th>
                  )}
                  <th>Delete</th>
                  <th>Restore</th>
                  <th>Download</th>
                </tr>
                {
                  this.generateRows(snapshots)
                }
              </table>
            </>
            :
            null
          }
        </div>
        <input
          type="text"
          name="payloadBox"
          placeholder="Enter snapshot name here..."
          value={newSnapshotName}
          onChange={this.handleChange}
        />

        <button value="Send" onClick={() => this.createSnapshot('mysql-data-pool', newSnapshotName)}>Create snapshot</button>
        <input type="file" name="file" onChange={this.onChangeHandler} />
        <button type="button" onClick={this.onClickHandler}>Upload</button>
      </div >
    );
  }
}
