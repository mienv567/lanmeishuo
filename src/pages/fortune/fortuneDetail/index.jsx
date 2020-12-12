import Taro, { Component } from '@tarojs/taro'
import BaseComponent from "../../../components/BaseComponent";
import { View, ScrollView } from '@tarojs/components'
import './index.less'
import { connect } from '@tarojs/redux';
import { AtIcon, AtAvatar } from 'taro-ui';
import { getSelfRecord, actionNavBack, customTime, getDateFromStr } from "../../../utils/common";
import { getWindowHeight } from "../../../utils/style";


@connect(({ fortuneDetail, common, fortune }) => ({
    ...fortuneDetail, ...common, ...fortune
}))
export default class Index extends BaseComponent {
    constructor() {
        super(...arguments)
        this.state = {
            is_show_day_calendar_modal: false,//是否显示日运日历alert

        }
    }

    config = {
        navigationBarTitleText: '运势预测'
    }

    componentDidMount() { }

    componentDidShow() {
        let is_request = false;//是否请求网络，获取数据
        let current_rid = '';//当前选中档案的id
        let records = this.props.records;
        if (records.length == 0) {//如果为空，那么把自己的档案传进去
            let record_self = getSelfRecord();
            current_rid = record_self.id;
            //获取自己的档案
            records.push(record_self);
        } else if (this.props.selected_records.length > 0) {//如果有选中的档案，那么把这个档案传进去
            let selected_record = this.props.selected_records[0];
            is_request = true;
            current_rid = selected_record.id;

            //如果选择的档案，在档案列表里，那么先移除，再增加
            let index_item_in_array = -1;
            for (let i = 0; i < records.length; i++) {
                if (current_rid == records[i].id) {
                    index_item_in_array = i;
                }
            }
            this.log('index_item_in_array=' + index_item_in_array);
            if (index_item_in_array >= 0) {//如果存在，那么替换
                this.log('records=');
                this.log(records);

                //删除重名的档案
                records.splice(index_item_in_array, 1);
                this.log('after sub,records=');
                this.log(records);

                //插入一样的档案到第一个位置
                records.unshift(selected_record);
                this.log('after add,records=');
                this.log(records);

            } else {//如果不存在，那么进行正常的移除添加
                //如果数量大于4个，那么移除第一个
                if (records >= 4) {
                    records.pop();
                }
                //在数组的前端添加项
                records.unshift(selected_record);
            }

            //设置选中的档案为空
            this.props.dispatch({
                type: 'common/save',
                payload: {
                    selected_records: [],
                }
            });
        }

        if (current_rid == '' && records.length > 0) {
            current_rid = records[0].id;
        }

        //保存所有的档案
        this.props.dispatch({
            type: 'fortuneDetail/save',
            payload: {
                rid: current_rid,
                records: records,
            }
        });

        if (is_request) {
            //请求数据
            this.actionTabItem(this.props.current_tab);
        }

    }

    //tab点击事件
    actionTabItem = (param) => {
        let index = 0;
        if (param instanceof Object) {
            index = param.currentTarget.dataset.index;
        } else {
            index = param;
        }
        this.log('actionTabItem index=' + index);
        //保存当前选中的tab
        this.props.dispatch({
            type: 'fortuneDetail/save',
            payload: {
                current_tab: index,
            }
        });

        //请求数据
        switch (Number(index)) {
            case 0: {
                this.requestFortuneDay();
                break;
            }
            case 1: {
                this.requestFortuneMonth();
                break;
            }
            case 2: {
                this.requestFortuneYear();
                break;
            }

        }
    }

    //请求日运数据
    requestFortuneDay() {
        //请求运势数据
        this.props.dispatch({
            type: 'fortuneDetail/day_detail',
        });
    }

    //请求月运数据
    requestFortuneMonth() {
        this.log('requestFortuneMonth');
        //请求运势数据
        this.props.dispatch({
            type: 'fortuneDetail/month_detail',
        });
    }

    //请求年运数据
    requestFortuneYear() {
        //this.log('requestFortuneYear');
        //请求运势数据
        this.props.dispatch({
            type: 'fortuneDetail/year_detail',
        });
    }

    //顶部档案 被点击
    onClickRecord = (index) => {
        this.log('fortuneDetail onClickRecord name=' + this.props.records[index].name);
        let item = this.props.records[index];
        let records = this.props.records;
        records.splice(index, 1);
        records.unshift(item);

        //更新档案数据
        this.props.dispatch({
            type: 'fortuneDetail/save',
            payload: {
                rid: item.id,
            }
        });

        //请求数据
        this.actionTabItem(this.props.current_tab);
    }

    //日运-日历 确定或者取消 按钮，被点击
    onCalendarCancelOrOk = (is_ok, date) => {
        this.log('onClickModalCalendarCancelOrOk is_ok=' + is_ok + ',date=' + date);
        if (1 == is_ok) {//点击确定，那么切换日期
            this.onClickDay(getDateFromStr(date), true);
        }
        this.setState({ is_show_day_calendar_modal: false });
    }

    //日运-日历 上一个月或者下一个月被点击【date为日期str，例如：2019-02-09】
    onCalendarPreOrNextMonthClick = (date) => {
        this.log('onCalendarPreOrNextMonthClick date=' + getDateFromStr(date));

        this.props.dispatch({
            type: 'fortuneDetail/save',
            payload: {
                day_param_time: getDateFromStr(date)
            }
        })
        this.requestCalendarData();
    }

    //日运-日历 被点击【time为date类型】
    onClickCalendarImg = (time) => {
        this.log('onClickCalendarImg time=' + time);
        this.setState({ is_show_day_calendar_modal: true });
        this.requestCalendarData();
    }

    //日运-日历-请求数据
    requestCalendarData = () => {

        //请求数据
        this.props.dispatch({
            type: 'fortuneDetail/day_calendar_request',
        }).then((data) => {
            let elements = document.getElementsByClassName('at-calendar__list');
            // this.log(elements)
            if (data.fortune) {
                //先隐藏所有标识
                for (let i = 0; i < elements[0].children.length; i++) {
                    elements[0].children[i].children[1].style = "display:none;"
                }

                //已解锁的标识
                for (let i = 0; i < elements[0].children.length; i++) {
                    data.fortune.map((item) => {
                        if (parseInt(elements[0].children[i].children[0].innerText) == parseInt(item)) {
                            elements[0].children[i].children[1].style =
                                'width:3px;' +
                                'height:3px;' +
                                'background:green;' +
                                'border-radius: 3px;' +
                                'position: absolute;' +
                                'left: 50%;' +
                                'transform: translateX(-50%);';
                        }
                    })
                }

                //运势日记的标识
                data.time.map((item) => {
                    for (let i = 0; i < elements[0].children.length; i++) {
                        if (parseInt(elements[0].children[i].children[0].innerText) == parseInt(item)) {
                            elements[0].children[i].children[1].style =
                                'width:3px;' +
                                'height:3px;' +
                                'background:red;' +
                                'border-radius: 3px;' +
                                'position: absolute;' +
                                'left: 50%;' +
                                'transform: translateX(-50%);';
                        }
                    }
                })
            }
        });
    }

    //日运日期 被点击【time 为date类型】
    onClickDay = (time, is_request_data = false) => {
        this.log('onClickDay time=' + time)
        this.setState({ is_show_day_calendar_modal: false });

        //更新当前页面的日期数据
        this.props.dispatch({
            type: 'fortuneDetail/save',
            payload: {
                day_param_time: time,
            }
        });

        //请求运势数据
        this.props.dispatch({
            type: 'fortuneDetail/day_detail',
        });

    }

    //月运或者年运日期 被点击
    onClickMonthOrYear = (year, month) => {
        // this.log('fortuneDetail onClickMonthOrYear year=' + year + ',month=' + month);
        //先保存数据
        if (month == -1) {//年运
            this.props.dispatch({
                type: 'fortuneDetail/save',
                payload: {
                    year_param_year: year,
                }
            });
        } else {//月运
            //先保存数据
            this.props.dispatch({
                type: 'fortuneDetail/save',
                payload: {
                    month_param_year: year,
                    month_param_month: month,
                }
            });
        }

        if (this.props.current_tab == 1) {
            this.requestFortuneMonth();
        } else {
            this.requestFortuneYear();
        }

    }


    //日运或月运或者年运点击解锁按钮
    onClickUnlock = (year, month, day) => {
        this.log('fortuneDetail onClickUnlock year=' + year + ',month=' + month);

        if (this.props.current_tab == 1) {//月运
            year = this.props.month_param_year;
            month = this.props.month_param_month;
        } else if (this.props.current_tab == 2) {//年运
            year = this.props.year_param_year;
        } else {//日运
            year = customTime(this.props.day_param_time, 8, true)
        }
        if (!month) {
            month = new Date().getMonth() + 1;
        }
        if (!day) {
            day = new Date().getDate();
        }
        this.log('date=' + year + '-' + month + '-' + day)

        Taro.navigateTo(
            {
                url: '/pages/fortune/fortuneOrder/index?rid=' + this.props.rid + '&type=' + this.props.current_tab + '&year=' + year + '&month=' + month + '&day=' + day
            }
        );

    }

    //点击日运弹出框，“再考虑”或者“去购买”
    onClickModal = (value) => {
        if (value == 0) {//取消按钮，被点击，那么隐藏对话框
            this.props.dispatch({
                type: 'fortuneDetail/save',
                payload: {
                    is_show_day_modal: false,
                }
            });
        } else {
            this.log('去购买 this.day_param_time=' + this.props.day_param_time);
            this.onClickUnlock(customTime(this.props.day_param_time, 8, true), customTime(this.props.day_param_time, 9, true), customTime(this.props.day_param_time, 10, true));
        }
    }

    render() {
        const {
            is_show_day_calendar_modal
        } = this.state;
        const {
            tabs,
            current_tab,
            day_detail,
            day_param_time,
            error,
            is_show_day_modal,
            day_calendar_data,
        } = this.props;
        return (
            <View className='fortune-detail-page'>
                <View className='nav-con'>
                    <AtIcon
                        onClick={this.actionNavBack}
                        value='chevron-left'
                        className='nav-back'
                    />
                    {/*tab栏*/}
                    <View className='tab-container'>
                        <View className='tabs'>
                            {tabs && tabs.length > 0 && tabs.map((item, index) =>
                                <View className='item' data-index={index} onClick={this.actionTabItem.bind()} key={index}>
                                    <View className={current_tab == index ? 'title title-selected' : 'title '}>{item}</View>
                                    {current_tab == index && (<View className='line'></View>)}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <ScrollView
                    className='scrollview'
                    scrollY
                    scrollWithAnimation
                    scrollTop='0'
                    style={'height: ' + getWindowHeight(false, true, 0) + 'px;'}
                    lowerThreshold='20'
                    onScrollToLower={this.onScrollToLower}
                >

                    <View className='pane-page'>
                        {/*顶部档案部分*/}
                        {/* <FortuneRecords
                            onClickRecord={this.onClickRecord}
                            records={this.props.records}
                        /> */}
                        <View className="record">
                            <View className="user">
                                <View className="avator">
                                    <AtAvatar circle className="img" ></AtAvatar>
                                    <View className="bottom">更换身份</View>
                                </View>
                                <View className="name">韩钰</View>
                            </View>
                            <View className="time">2020.09.10 星期四</View>
                        </View>

                        {/*日运部分*/}
                        {
                            current_tab == 0 && (
                                <View>
                                    111

                                </View>
                            )}

                        {/*月运部分*/}
                        {
                            current_tab == 1 && (
                                <View>
                                    222
                                </View>
                            )}

                        {/*年运部分*/}
                        {
                            current_tab == 2 && (
                                <View>
                                    333
                                </View>
                            )}


                    </View>
                </ScrollView>
            </View>
        )
    }
}
