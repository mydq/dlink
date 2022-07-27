import {history} from 'umi';
import {queryData} from "@/components/Common/crud";
import {useState, useRef, useEffect} from "react";
import type {ProColumns, ActionType} from '@ant-design/pro-table';
import ProTable from "@ant-design/pro-table";
import {Badge, message} from 'antd'
import {JobInstanceTableListItem} from "@/pages/DevOps/data";
import moment from 'moment';
import {RUN_MODE} from "@/components/Studio/conf";
import JobStatus from "@/components/Common/JobStatus";
import JobLifeCycle, {JOB_LIFE_CYCLE} from "@/components/Common/JobLifeCycle";
import OpsStatusModal from "../OpsStatusModal/index";
import StatusDetailedModal from "../StatusDetailedModal/index";
import {
  queryOneClickOperatingTaskStatus,
  onClickOperatingTask,
  queryAllCatalogue
} from "@/pages/DevOps/service";

const OPS_STATUS_COLOR = {
  success: 'lime',
  padding: 'yellow',

}
const url = '/api/jobInstance';
const JobInstanceTable = (props: any) => {

  const {status, activeKey, isHistory, taskStatus} = props;
  const [time, setTime] = useState(() => Date.now());
  const [opsStatusVisible, setOpsStatusVisible] = useState<boolean>(false);
  const [opsStatus, setOpsStatus] = useState<string>('');
  const [opsStatusListTree, setOpsStatusListTree] = useState<any[]>([]);
  const [statusDetailedVisible, setStatusDetailedVisible] = useState<boolean>(false);
  const [statusDetailedList, setStatusDetailedList] = useState<any[]>([]);
  const ref = useRef<ActionType>();
  useEffect(() => {
    ref?.current?.reload();
  }, [isHistory]);

  /**
   * oGoOnline 状态上下线
   * */
    // eslint-disable-next-line @typescript-eslint/no-shadow
  const onStatusChange = async (status: string) => {
      try {
        const {datas} = await queryAllCatalogue({operating: status})
        setOpsStatusListTree([datas])
        setOpsStatusVisible(true)
        setOpsStatus(status);
      } catch (e) {
        console.log(e)
      }
    }

  /**
   * onOpsStatusCallBack 上下线提交操作
   * */
  const onOpsStatusCallBack = async (values?: any) => {
    if (values) {
      try {
        await onClickOperatingTask(values)
        message.success('操作成功')
        setOpsStatusVisible(false)
      } catch (e) {
        console.log(e)
      }
    } else {
      setOpsStatusVisible(false)
    }
  }

  /**
   * onOfflineDetailed 上下线明细详情
   * */
    // eslint-disable-next-line @typescript-eslint/no-shadow
  const onStatusDetailed = async (status: string) => {
      const {datas} = await queryOneClickOperatingTaskStatus()
      datas.online = datas.online.map(({task, ...rest}: any) => {
        return {
          ...task,
          ...rest
        }
      })
      datas.offline = datas.offline.map(({task, ...rest}: any) => {
        return {
          ...task,
          ...rest
        }
      })
      const newStatusData = status === '1' ? datas.online : datas.offline
      setStatusDetailedList(newStatusData)
      setStatusDetailedVisible(true)
      setOpsStatus(status);
    }
  /**
   * onCancelStatusDetailed 上下线明细弹窗关闭回调
   * */
  const onCancelStatusDetailed = () => {
    setStatusDetailedVisible(false)
  }

  const getColumns = () => {
    const columns: ProColumns<JobInstanceTableListItem>[] = [{
      title: "作业名",
      dataIndex: "name",
      sorter: true,
    }, {
      title: "生命周期",
      dataIndex: "step",
      sorter: true,
      valueType: 'radio',
      valueEnum: {
        '': {text: '全部', status: 'ALL'},
        2: {
          text: '开发中',
          status: JOB_LIFE_CYCLE.DEVELOP,
        },
        4: {
          text: '已发布',
          status: JOB_LIFE_CYCLE.RELEASE,
        },
        5: {
          text: '已上线',
          status: JOB_LIFE_CYCLE.ONLINE,
        },
        0: {
          text: '未知',
          status: JOB_LIFE_CYCLE.UNKNOWN,
        },
      },
      render: (_, row) => {
        return (<JobLifeCycle step={row.step}/>);
      }
    }, {
      title: "运行模式",
      dataIndex: "type",
      sorter: true,
      valueType: 'radio',
      valueEnum: {
        '': {text: '全部', status: 'ALL'},
        'local': {
          text: RUN_MODE.LOCAL,
          status: RUN_MODE.LOCAL,
        },
        'standalone': {
          text: RUN_MODE.STANDALONE,
          status: RUN_MODE.STANDALONE,
        },
        'yarn-session': {
          text: RUN_MODE.YARN_SESSION,
          status: RUN_MODE.YARN_SESSION,
        },
        'yarn-per-job': {
          text: RUN_MODE.YARN_PER_JOB,
          status: RUN_MODE.YARN_PER_JOB,
        },
        'yarn-application': {
          text: RUN_MODE.YARN_APPLICATION,
          status: RUN_MODE.YARN_APPLICATION,
        },
        'kubernetes-session': {
          text: RUN_MODE.KUBERNETES_SESSION,
          status: RUN_MODE.KUBERNETES_SESSION,
        },
        'kubernetes-application': {
          text: RUN_MODE.KUBERNETES_APPLICATION,
          status: RUN_MODE.KUBERNETES_APPLICATION,
        },
      },
    }, {
      title: "集群实例",
      dataIndex: "clusterAlias",
      sorter: true,
    }, {
      title: "作业ID",
      dataIndex: "jid",
      key: "jid",
    }, {
      title: "状态",
      dataIndex: "status",
      sorter: true,
      hideInSearch: true,
      render: (_, row) => {
        return (
          <JobStatus status={row.status}/>)
          ;
      }
    }, {
      title: "开始时间",
      dataIndex: "createTime",
      sorter: true,
      valueType: 'dateTime',
      hideInSearch: true,
    }, {
      title: "更新时间",
      dataIndex: "updateTime",
      sorter: true,
      valueType: 'dateTime',
      hideInTable: true,
      hideInSearch: true,
    }, {
      title: "结束时间",
      dataIndex: "finishTime",
      sorter: true,
      valueType: 'dateTime',
      hideInTable: true,
      hideInSearch: true,
    }, {
      title: "耗时",
      dataIndex: "duration",
      sorter: true,
      valueType: 'second',
      hideInSearch: true,
    },];
    return columns;
  };

  return (
    <><ProTable
      actionRef={ref}
      toolBarRender={() => [<Badge
        color={taskStatus?.onlineStatus ? OPS_STATUS_COLOR.padding : OPS_STATUS_COLOR.success} text={<a
        onClick={() => {
          onStatusChange('1')
        }}>一键上线</a>}/>,
        <a
          style={{color: taskStatus?.onlineStatus ? '#FF0000' : '#1E90FF'}}
          onClick={() => {
            onStatusDetailed('1')
          }}>上线明细</a>,
        <Badge color={taskStatus?.offlineStatus ? OPS_STATUS_COLOR.padding : OPS_STATUS_COLOR.success}
               text={<a onClick={() => {
                 onStatusChange('2')
               }}>一键下线</a>}/>, <a
          style={{color: taskStatus?.onlineStatus ? '#FF0000' : '#1E90FF'}}
          onClick={() => {
            onStatusDetailed('2')
          }}>下线明细</a>,]}
      request={(params, sorter, filter) => {
        setTime(Date.now());
        return queryData(url, {...params, status, isHistory, sorter: {id: 'descend'}, filter});
      }}
      columns={getColumns()}
      size="small"
      search={{
        filterType: 'light',
      }}
      headerTitle={`上次更新时间：${moment(time).format('HH:mm:ss')}`}
      polling={status == activeKey ? 3000 : undefined}
      pagination={{
        pageSize: 5,
      }}
      onRow={record => {
        return {
          onClick: event => {
            history.push({
              pathname: '/job',
              query: {
                id: record.id,
              },
            });
          },
        };
      }}
    />
      <OpsStatusModal opsStatusListTree={opsStatusListTree} opsStatusVisible={opsStatusVisible} opsStatus={opsStatus}
                      onOpsStatusCallBack={onOpsStatusCallBack}/>
      <StatusDetailedModal opsStatus={opsStatus} statusDetailedList={statusDetailedList}
                           statusDetailedVisible={statusDetailedVisible}
                           onCancelStatusDetailed={onCancelStatusDetailed}
      />

    </>
  );
};

export default JobInstanceTable;
