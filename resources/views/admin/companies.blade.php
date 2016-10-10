@extends('admin.layout')

@section('content')
<div class="col-lg-12">
    <h2>Companies</h2>
    <table class="table table-hover">
        <tr>
            <th>
                Created At
            </th>
            <th>
                Title
            </th>
            <th>
                Subscription Plan
            </th>
            <th>
                Admin Email
            </th>
        </tr>
        @foreach ($companies as $company)
        <tr onclick="window.location = '/admin/companies/{{$company->id}}'">
            <td>{{$company->created_at}}</td>
            <td>{{$company->title}}</td>
            <td>{{$company->subscription_plan}} ({{$company->subscription_status}})</td>
            <td>{{$company->admin_email}}</td>
        </tr>
        @endforeach
    </table>

</div>
@stop